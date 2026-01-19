'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { BlockType } from '@prisma/client'

// ========================================
// TYPES
// ========================================

export interface CreateBlockInput {
    pageId: string
    type: BlockType
    content?: Record<string, unknown>
    parentBlockId?: string | null
    sortOrder?: number
}

export interface UpdateBlockInput {
    content?: Record<string, unknown>
    sortOrder?: number
}

// ========================================
// GET BLOCKS FOR PAGE
// ========================================

export async function getBlocksForPage(pageId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', blocks: [] }
        }

        // Verify page ownership
        const page = await prisma.page.findFirst({
            where: { id: pageId, userId: user.id },
            select: { id: true },
        })

        if (!page) {
            return { success: false, error: 'Page not found', blocks: [] }
        }

        const blocks = await prisma.block.findMany({
            where: {
                pageId,
                parentBlockId: null, // Get top-level blocks only
            },
            include: {
                databaseViews: true,
                childBlocks: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        databaseViews: true,
                    },
                },
            },
            orderBy: { sortOrder: 'asc' },
        })

        return { success: true, blocks }
    } catch (error) {
        console.error('Error fetching blocks:', error)
        return { success: false, error: 'Failed to fetch blocks', blocks: [] }
    }
}

// ========================================
// CREATE BLOCK
// ========================================

export async function createBlock(data: CreateBlockInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', block: null }
        }

        // Verify page ownership
        const page = await prisma.page.findFirst({
            where: { id: data.pageId, userId: user.id },
            select: { id: true },
        })

        if (!page) {
            return { success: false, error: 'Page not found', block: null }
        }

        // Get max sort order if not provided
        let sortOrder = data.sortOrder
        if (sortOrder === undefined) {
            const maxSortOrder = await prisma.block.aggregate({
                where: { pageId: data.pageId, parentBlockId: data.parentBlockId || null },
                _max: { sortOrder: true },
            })
            sortOrder = (maxSortOrder._max.sortOrder || 0) + 1
        }

        const block = await prisma.block.create({
            data: {
                pageId: data.pageId,
                type: data.type,
                content: data.content || {},
                parentBlockId: data.parentBlockId || null,
                sortOrder,
            },
            include: {
                databaseViews: true,
            },
        })

        revalidatePath(`/private/${data.pageId}`)

        return { success: true, block }
    } catch (error) {
        console.error('Error creating block:', error)
        return { success: false, error: 'Failed to create block', block: null }
    }
}

// ========================================
// UPDATE BLOCK
// ========================================

export async function updateBlock(id: string, data: UpdateBlockInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', block: null }
        }

        // Verify ownership via page
        const existing = await prisma.block.findFirst({
            where: { id },
            include: { page: { select: { userId: true } } },
        })

        if (!existing || existing.page.userId !== user.id) {
            return { success: false, error: 'Block not found or access denied', block: null }
        }

        const block = await prisma.block.update({
            where: { id },
            data: {
                ...(data.content !== undefined && { content: data.content }),
                ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
            },
            include: {
                databaseViews: true,
            },
        })

        revalidatePath(`/private/${existing.pageId}`)

        return { success: true, block }
    } catch (error) {
        console.error('Error updating block:', error)
        return { success: false, error: 'Failed to update block', block: null }
    }
}

// ========================================
// DELETE BLOCK
// ========================================

export async function deleteBlock(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify ownership via page
        const existing = await prisma.block.findFirst({
            where: { id },
            include: { page: { select: { userId: true, id: true } } },
        })

        if (!existing || existing.page.userId !== user.id) {
            return { success: false, error: 'Block not found or access denied' }
        }

        await prisma.block.delete({
            where: { id },
        })

        revalidatePath(`/private/${existing.page.id}`)

        return { success: true }
    } catch (error) {
        console.error('Error deleting block:', error)
        return { success: false, error: 'Failed to delete block' }
    }
}

// ========================================
// INSERT BLOCK AT POSITION
// ========================================

export async function insertBlockAt(
    pageId: string,
    type: BlockType,
    afterBlockId: string | null,
    content?: Record<string, unknown>
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', block: null }
        }

        // Verify page ownership
        const page = await prisma.page.findFirst({
            where: { id: pageId, userId: user.id },
            select: { id: true },
        })

        if (!page) {
            return { success: false, error: 'Page not found', block: null }
        }

        let sortOrder = 0

        if (afterBlockId) {
            // Get the block we're inserting after
            const afterBlock = await prisma.block.findFirst({
                where: { id: afterBlockId, pageId },
                select: { sortOrder: true, parentBlockId: true },
            })

            if (afterBlock) {
                // Get the next block to calculate position between
                const nextBlock = await prisma.block.findFirst({
                    where: {
                        pageId,
                        parentBlockId: afterBlock.parentBlockId,
                        sortOrder: { gt: afterBlock.sortOrder },
                    },
                    select: { sortOrder: true },
                    orderBy: { sortOrder: 'asc' },
                })

                if (nextBlock) {
                    // Insert between
                    sortOrder = (afterBlock.sortOrder + nextBlock.sortOrder) / 2
                } else {
                    // Insert at end
                    sortOrder = afterBlock.sortOrder + 1
                }
            }
        }

        const block = await prisma.block.create({
            data: {
                pageId,
                type,
                content: content || {},
                sortOrder,
            },
            include: {
                databaseViews: true,
            },
        })

        revalidatePath(`/private/${pageId}`)

        return { success: true, block }
    } catch (error) {
        console.error('Error inserting block:', error)
        return { success: false, error: 'Failed to insert block', block: null }
    }
}

// ========================================
// REORDER BLOCKS
// ========================================

export async function reorderBlocks(pageId: string, blockIds: string[]) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify page ownership
        const page = await prisma.page.findFirst({
            where: { id: pageId, userId: user.id },
            select: { id: true },
        })

        if (!page) {
            return { success: false, error: 'Page not found' }
        }

        // Update sort order for each block
        await prisma.$transaction(
            blockIds.map((id, index) =>
                prisma.block.updateMany({
                    where: { id, pageId },
                    data: { sortOrder: index },
                })
            )
        )

        revalidatePath(`/private/${pageId}`)

        return { success: true }
    } catch (error) {
        console.error('Error reordering blocks:', error)
        return { success: false, error: 'Failed to reorder blocks' }
    }
}

// ========================================
// DUPLICATE BLOCK
// ========================================

export async function duplicateBlock(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', block: null }
        }

        // Get original block
        const original = await prisma.block.findFirst({
            where: { id },
            include: {
                page: { select: { userId: true } },
                databaseViews: true,
            },
        })

        if (!original || original.page.userId !== user.id) {
            return { success: false, error: 'Block not found', block: null }
        }

        // Create duplicate with slightly higher sort order
        const block = await prisma.block.create({
            data: {
                pageId: original.pageId,
                type: original.type,
                content: original.content as Record<string, unknown>,
                parentBlockId: original.parentBlockId,
                sortOrder: original.sortOrder + 0.5,
            },
            include: {
                databaseViews: true,
            },
        })

        // If it's a database block, duplicate all views
        if (original.databaseViews && original.databaseViews.length > 0) {
            for (const view of original.databaseViews) {
                await prisma.databaseView.create({
                    data: {
                        blockId: block.id,
                        name: view.name,
                        sourceType: view.sourceType,
                        viewType: view.viewType,
                        filters: view.filters as object | undefined,
                        sorts: view.sorts as object | undefined,
                        visibleFields: view.visibleFields as object | undefined,
                        groupBy: view.groupBy,
                        isDefault: view.isDefault,
                        sortOrder: view.sortOrder,
                    },
                })
            }
        }

        revalidatePath(`/private/${original.pageId}`)

        return { success: true, block }
    } catch (error) {
        console.error('Error duplicating block:', error)
        return { success: false, error: 'Failed to duplicate block', block: null }
    }
}
