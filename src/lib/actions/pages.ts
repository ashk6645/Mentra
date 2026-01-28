'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// ========================================
// TYPES
// ========================================

export interface CreatePageInput {
    title?: string
    icon?: string
    parentPageId?: string | null
    coverImage?: string | null
}

export interface UpdatePageInput extends Partial<CreatePageInput> {
    isFavorited?: boolean
    sortOrder?: number
}

// ========================================
// GET PAGES (for sidebar)
// ========================================

export async function getPages() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', pages: [] }
        }

        const pages = await prisma.page.findMany({
            where: {
                OR: [
                    { userId: user.id },
                    { sharedWith: { some: { sharedWithUserId: user.id } } }
                ]
            },
            select: {
                id: true,
                title: true,
                icon: true,
                parentPageId: true,
                isFavorited: true,
                sortOrder: true,
                createdAt: true,
                updatedAt: true,
                userId: true, // Needed to distinguish ownership
            },
            orderBy: [
                { isFavorited: 'desc' },
                { sortOrder: 'asc' },
                { createdAt: 'desc' },
            ],
        })

        return { success: true, pages }
    } catch (error) {
        console.error('Error fetching pages:', error)
        return { success: false, error: 'Failed to fetch pages', pages: [] }
    }
}

// ========================================
// GET PAGE BY ID (with blocks)
// ========================================

export async function getPageById(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', page: null }
        }

        if (!id || typeof id !== 'string') {
            return { success: false, error: 'Invalid page ID', page: null }
        }

        const page = await prisma.page.findFirst({
            where: {
                id,
                OR: [
                    { userId: user.id },
                    { sharedWith: { some: { sharedWithUserId: user.id } } }
                ]
            },
            include: {
                sharedWith: {
                    where: { sharedWithUserId: user.id },
                    select: { permission: true }
                },
                blocks: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        databaseViews: true,
                        childBlocks: {
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
                childPages: {
                    select: {
                        id: true,
                        title: true,
                        icon: true,
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        })

        if (!page) {
            return { success: false, error: 'Page not found', page: null }
        }

        // Calculate permission
        let currentUserPermission = 'view'
        if (page.userId === user.id) {
            currentUserPermission = 'owner'
        } else if (page.sharedWith.length > 0) {
            currentUserPermission = page.sharedWith[0].permission
        }

        return { success: true, page: { ...page, currentUserPermission } }
    } catch (error) {
        console.error('Error fetching page:', error)
        return { success: false, error: 'Failed to fetch page', page: null }
    }
}

// ========================================
// CREATE PAGE
// ========================================

export async function createPage(data: CreatePageInput = {}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', page: null }
        }

        // Get max sort order for new pages
        const maxSortOrder = await prisma.page.aggregate({
            where: { userId: user.id, parentPageId: data.parentPageId || null },
            _max: { sortOrder: true },
        })

        const page = await prisma.page.create({
            data: {
                userId: user.id,
                title: data.title || 'Untitled',
                icon: data.icon || '📄',
                parentPageId: data.parentPageId || null,
                coverImage: data.coverImage || null,
                sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
            },
        })

            ; (revalidateTag as any)(`pages-${user.id}`)
        // Note: revalidatePath moved to caller to avoid Next.js 16 render issues
        return { success: true, page }
    } catch (error) {
        console.error('Error creating page:', error)
        return { success: false, error: 'Failed to create page', page: null }
    }
}

// ========================================
// UPDATE PAGE
// ========================================

export async function updatePage(id: string, data: UpdatePageInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', page: null }
        }

        if (!id || typeof id !== 'string') {
            return { success: false, error: 'Invalid page ID', page: null }
        }

        // Verify ownership
        const existing = await prisma.page.findFirst({
            where: { id, userId: user.id },
            select: { id: true },
        })

        if (!existing) {
            return { success: false, error: 'Page not found or access denied', page: null }
        }

        const page = await prisma.page.update({
            where: { id },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.icon !== undefined && { icon: data.icon }),
                ...(data.parentPageId !== undefined && { parentPageId: data.parentPageId }),
                ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
                ...(data.isFavorited !== undefined && { isFavorited: data.isFavorited }),
                ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
            },
        })

            ; (revalidateTag as any)(`pages-${user.id}`)
        revalidatePath('/', 'layout')
        revalidatePath(`/private/${id}`)

        return { success: true, page }
    } catch (error) {
        console.error('Error updating page:', error)
        return { success: false, error: 'Failed to update page', page: null }
    }
}

// ========================================
// DELETE PAGE
// ========================================

export async function deletePage(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        if (!id || typeof id !== 'string') {
            return { success: false, error: 'Invalid page ID' }
        }

        // Verify ownership
        const existing = await prisma.page.findFirst({
            where: { id, userId: user.id },
            select: { id: true },
        })

        if (!existing) {
            return { success: false, error: 'Page not found or access denied' }
        }

        // Delete page (cascade deletes blocks and child pages)
        await prisma.page.delete({
            where: { id },
        })

            ; (revalidateTag as any)(`pages-${user.id}`)
        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error) {
        console.error('Error deleting page:', error)
        return { success: false, error: 'Failed to delete page' }
    }
}

// ========================================
// REORDER PAGES
// ========================================

export async function reorderPages(pageIds: string[]) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Update sort order for each page
        await prisma.$transaction(
            pageIds.map((id, index) =>
                prisma.page.updateMany({
                    where: { id, userId: user.id },
                    data: { sortOrder: index },
                })
            )
        )

            ; (revalidateTag as any)(`pages-${user.id}`)
        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error) {
        console.error('Error reordering pages:', error)
        return { success: false, error: 'Failed to reorder pages' }
    }
}

// ========================================
// TOGGLE FAVORITE
// ========================================

export async function togglePageFavorite(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const page = await prisma.page.findFirst({
            where: { id, userId: user.id },
            select: { id: true, isFavorited: true },
        })

        if (!page) {
            return { success: false, error: 'Page not found' }
        }

        const updated = await prisma.page.update({
            where: { id },
            data: { isFavorited: !page.isFavorited },
        })

            ; (revalidateTag as any)(`pages-${user.id}`)
        revalidatePath('/', 'layout')

        return { success: true, isFavorited: updated.isFavorited }
    } catch (error) {
        console.error('Error toggling favorite:', error)
        return { success: false, error: 'Failed to toggle favorite' }
    }
}
