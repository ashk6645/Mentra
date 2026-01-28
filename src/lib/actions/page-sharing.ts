'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const sharePageSchema = z.object({
    pageId: z.string().uuid(),
    email: z.string().email(),
    permission: z.enum(['view', 'edit', 'admin']).default('view'),
})

export type SharePageInput = z.infer<typeof sharePageSchema>

/**
 * Share a page with another user by email
 */
export async function sharePage(data: SharePageInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const parseResult = sharePageSchema.safeParse(data)
    if (!parseResult.success) {
        return { success: false, error: 'Invalid input' }
    }

    const { pageId, email, permission } = parseResult.data

    try {
        // 1. Verify verify ownership/admin access
        const page = await prisma.page.findUnique({
            where: { id: pageId },
            include: {
                sharedWith: {
                    where: { sharedWithUserId: user.id }
                }
            }
        })

        if (!page) {
            return { success: false, error: 'Page not found' }
        }

        const isOwner = page.userId === user.id
        const isAdmin = page.sharedWith.some(share => share.permission === 'admin')

        if (!isOwner && !isAdmin) {
            return { success: false, error: 'You do not have permission to share this page' }
        }

        // 2. Find target user
        const targetUser = await prisma.profile.findUnique({
            where: { email }
        })

        if (!targetUser) {
            return { success: false, error: 'User not found. They must have a TaskFlow account.' }
        }

        if (targetUser.id === user.id) {
            return { success: false, error: 'You cannot share a page with yourself' }
        }

        if (targetUser.id === page.userId) {
            return { success: false, error: 'User is already the owner of this page' }
        }

        // 3. Create or Update SharedPage
        await prisma.sharedPage.upsert({
            where: {
                pageId_sharedWithUserId: {
                    pageId,
                    sharedWithUserId: targetUser.id
                }
            },
            update: {
                permission
            },
            create: {
                pageId,
                sharedByUserId: user.id,
                sharedWithUserId: targetUser.id,
                permission
            }
        })

        revalidatePath(`/private/${pageId}`)
        revalidateTag(`pages-${targetUser.id}`) // Invalidate for the recipient

        return { success: true }
    } catch (error) {
        console.error('Error sharing page:', error)
        return { success: false, error: 'Failed to share page' }
    }
}

/**
 * Remove a collaborator from a page
 */
export async function unsharePage(pageId: string, collaboratorId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // 1. Verify access
        const page = await prisma.page.findUnique({
            where: { id: pageId },
            include: {
                sharedWith: {
                    where: { sharedWithUserId: user.id }
                }
            }
        })

        if (!page) {
            return { success: false, error: 'Page not found' }
        }

        const isOwner = page.userId === user.id
        const isAdmin = page.sharedWith.some(share => share.permission === 'admin')
        const isSelfLeaving = user.id === collaboratorId

        if (!isOwner && !isAdmin && !isSelfLeaving) {
            return { success: false, error: 'Permission denied' }
        }

        // 2. Delete
        await prisma.sharedPage.delete({
            where: {
                pageId_sharedWithUserId: {
                    pageId,
                    sharedWithUserId: collaboratorId
                }
            }
        })

        revalidatePath(`/private/${pageId}`)
        revalidateTag(`pages-${collaboratorId}`)

        return { success: true }
    } catch (error) {
        console.error('Error unsharing page:', error)
        return { success: false, error: 'Failed to remove collaborator' }
    }
}

/**
 * Get list of collaborators for a page
 */
export async function getPageCollaborators(pageId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        // Verify access (just need to be able to view the page)
        const hasAccess = await prisma.page.findFirst({
            where: {
                id: pageId,
                OR: [
                    { userId: user.id },
                    { sharedWith: { some: { sharedWithUserId: user.id } } }
                ]
            }
        })

        if (!hasAccess) return []

        const collaborators = await prisma.sharedPage.findMany({
            where: { pageId },
            include: {
                sharedWith: {
                    select: {
                        id: true,
                        email: true,
                        displayName: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return collaborators.map(c => ({
            userId: c.sharedWith.id,
            email: c.sharedWith.email,
            displayName: c.sharedWith.displayName,
            avatarUrl: c.sharedWith.avatarUrl,
            permission: c.permission,
            joinedAt: c.createdAt
        }))
    } catch (error) {
        console.error('Error fetching collaborators:', error)
        return []
    }
}

/**
 * Update permission for a collaborator
 */
export async function updatePageCollaboratorPermission(
    pageId: string,
    collaboratorId: string,
    permission: 'view' | 'edit' | 'admin'
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // 1. Verify owner/admin
        const page = await prisma.page.findUnique({
            where: { id: pageId },
            include: {
                sharedWith: {
                    where: { sharedWithUserId: user.id }
                }
            }
        })

        if (!page) return { success: false, error: 'Page not found' }

        const isOwner = page.userId === user.id
        const isAdmin = page.sharedWith.some(share => share.permission === 'admin')

        if (!isOwner && !isAdmin) {
            return { success: false, error: 'Permission denied' }
        }

        // 2. Update
        await prisma.sharedPage.update({
            where: {
                pageId_sharedWithUserId: {
                    pageId,
                    sharedWithUserId: collaboratorId
                }
            },
            data: { permission }
        })

        revalidatePath(`/private/${pageId}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating permission:', error)
        return { success: false, error: 'Failed to update permission' }
    }
}

/**
 * Check if a user has a specific permission level for a page
 */
export async function hasPagePermission(
    pageId: string,
    userId: string,
    minPermission: 'view' | 'edit' | 'admin'
) {
    const page = await prisma.page.findUnique({
        where: { id: pageId },
        include: {
            sharedWith: {
                where: { sharedWithUserId: userId }
            }
        }
    })

    if (!page) return false

    // Owner has all permissions
    if (page.userId === userId) return true

    // Check shared permissions
    const share = page.sharedWith[0]
    if (!share) return false

    const levels = { 'view': 1, 'edit': 2, 'admin': 3 }
    const userLevel = levels[share.permission as keyof typeof levels] || 0
    const requiredLevel = levels[minPermission]

    return userLevel >= requiredLevel
}
