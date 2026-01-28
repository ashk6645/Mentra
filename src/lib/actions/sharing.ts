'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const shareProjectSchema = z.object({
    projectId: z.string().uuid(),
    email: z.string().email(),
    permission: z.enum(['view', 'edit', 'admin']).default('view'),
})

export type ShareProjectInput = z.infer<typeof shareProjectSchema>

/**
 * Share a project with another user by email
 */
export async function shareProject(data: ShareProjectInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const parseResult = shareProjectSchema.safeParse(data)
    if (!parseResult.success) {
        return { success: false, error: 'Invalid input' }
    }

    const { projectId, email, permission } = parseResult.data

    try {
        // 1. Verify verify ownership/admin access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                sharedWith: {
                    where: { sharedWithUserId: user.id }
                }
            }
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        const isOwner = project.userId === user.id
        const isAdmin = project.sharedWith.some(share => share.permission === 'admin')

        if (!isOwner && !isAdmin) {
            return { success: false, error: 'You do not have permission to share this project' }
        }

        // 2. Find target user
        const targetUser = await prisma.profile.findUnique({
            where: { email }
        })

        if (!targetUser) {
            return { success: false, error: 'User not found. They must have a TaskFlow account.' }
        }

        if (targetUser.id === user.id) {
            return { success: false, error: 'You cannot share a project with yourself' }
        }

        if (targetUser.id === project.userId) {
            return { success: false, error: 'User is already the owner of this project' }
        }

        // 3. Create or Update SharedProject
        await prisma.sharedProject.upsert({
            where: {
                projectId_sharedWithUserId: {
                    projectId,
                    sharedWithUserId: targetUser.id
                }
            },
            update: {
                permission
            },
            create: {
                projectId,
                sharedByUserId: user.id,
                sharedWithUserId: targetUser.id,
                permission
            }
        })

        revalidatePath(`/projects/${projectId}`)
        revalidateTag(`projects-${targetUser.id}`, {}) // Invalidate for the recipient

        return { success: true }
    } catch (error) {
        console.error('Error sharing project:', error)
        return { success: false, error: 'Failed to share project' }
    }
}

/**
 * Remove a collaborator from a project
 */
export async function unshareProject(projectId: string, collaboratorId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // 1. Verify access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                sharedWith: {
                    where: { sharedWithUserId: user.id }
                }
            }
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        const isOwner = project.userId === user.id
        const isAdmin = project.sharedWith.some(share => share.permission === 'admin')
        const isSelfLeaving = user.id === collaboratorId

        if (!isOwner && !isAdmin && !isSelfLeaving) {
            return { success: false, error: 'Permission denied' }
        }

        // 2. Delete
        await prisma.sharedProject.delete({
            where: {
                projectId_sharedWithUserId: {
                    projectId,
                    sharedWithUserId: collaboratorId
                }
            }
        })

        revalidatePath(`/projects/${projectId}`)
        revalidateTag(`projects-${collaboratorId}`, {})

        return { success: true }
    } catch (error) {
        console.error('Error unsharing project:', error)
        return { success: false, error: 'Failed to remove collaborator' }
    }
}

/**
 * Get list of collaborators for a project
 */
export async function getProjectCollaborators(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        // Verify access (just need to be able to view the project)
        const hasAccess = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { userId: user.id },
                    { sharedWith: { some: { sharedWithUserId: user.id } } }
                ]
            }
        })

        if (!hasAccess) return []

        const collaborators = await prisma.sharedProject.findMany({
            where: { projectId },
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
export async function updateCollaboratorPermission(
    projectId: string,
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
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                sharedWith: {
                    where: { sharedWithUserId: user.id }
                }
            }
        })

        if (!project) return { success: false, error: 'Project not found' }

        const isOwner = project.userId === user.id
        const isAdmin = project.sharedWith.some(share => share.permission === 'admin')

        if (!isOwner && !isAdmin) {
            return { success: false, error: 'Permission denied' }
        }

        // 2. Update
        await prisma.sharedProject.update({
            where: {
                projectId_sharedWithUserId: {
                    projectId,
                    sharedWithUserId: collaboratorId
                }
            },
            data: { permission }
        })

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating permission:', error)
        return { success: false, error: 'Failed to update permission' }
    }
}

/**
 * Check if a user has a specific permission level for a project
 */
export async function hasProjectPermission(
    projectId: string,
    userId: string,
    minPermission: 'view' | 'edit' | 'admin'
) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            sharedWith: {
                where: { sharedWithUserId: userId }
            }
        }
    })

    if (!project) return false

    // Owner has all permissions
    if (project.userId === userId) return true

    // Check shared permissions
    const share = project.sharedWith[0]
    if (!share) return false

    const levels = { 'view': 1, 'edit': 2, 'admin': 3 }
    const userLevel = levels[share.permission as keyof typeof levels] || 0
    const requiredLevel = levels[minPermission]

    return userLevel >= requiredLevel
}
