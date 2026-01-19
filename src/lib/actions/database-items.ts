'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// ========================================
// TYPES
// ========================================

export interface CreateDatabaseItemInput {
    blockId: string
    title?: string
    icon?: string
    properties?: Record<string, unknown>
}

export interface UpdateDatabaseItemInput {
    title?: string
    icon?: string
    coverImage?: string
    properties?: Record<string, unknown>
    sortOrder?: number
}

// ========================================
// GET DATABASE ITEMS
// ========================================

export async function getDatabaseItems(blockId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', items: [] }
        }

        // Verify block ownership via page
        const block = await prisma.block.findFirst({
            where: { id: blockId },
            include: { page: { select: { userId: true } } },
        })

        if (!block || block.page.userId !== user.id) {
            return { success: false, error: 'Block not found', items: [] }
        }

        const items = await prisma.databaseItem.findMany({
            where: { blockId },
            orderBy: { sortOrder: 'asc' },
        })

        return { success: true, items }
    } catch (error) {
        console.error('Error fetching database items:', error)
        return { success: false, error: 'Failed to fetch items', items: [] }
    }
}

// ========================================
// CREATE DATABASE ITEM
// ========================================

export async function createDatabaseItem(data: CreateDatabaseItemInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', item: null }
        }

        // Verify block ownership
        const block = await prisma.block.findFirst({
            where: { id: data.blockId },
            include: { page: { select: { userId: true, id: true } } },
        })

        if (!block || block.page.userId !== user.id) {
            return { success: false, error: 'Block not found', item: null }
        }

        // Get max sort order
        const maxSort = await prisma.databaseItem.aggregate({
            where: { blockId: data.blockId },
            _max: { sortOrder: true },
        })
        const sortOrder = (maxSort._max.sortOrder || 0) + 1

        const item = await prisma.databaseItem.create({
            data: {
                blockId: data.blockId,
                title: data.title || 'Untitled',
                icon: data.icon,
                properties: data.properties || {},
                sortOrder,
            },
        })

        revalidatePath(`/private/${block.page.id}`)

        return { success: true, item }
    } catch (error) {
        console.error('Error creating database item:', error)
        return { success: false, error: 'Failed to create item', item: null }
    }
}

// ========================================
// UPDATE DATABASE ITEM
// ========================================

export async function updateDatabaseItem(id: string, data: UpdateDatabaseItemInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', item: null }
        }

        // Verify ownership via block -> page
        const existing = await prisma.databaseItem.findFirst({
            where: { id },
            include: {
                block: { include: { page: { select: { userId: true, id: true } } } },
            },
        })

        if (!existing || existing.block.page.userId !== user.id) {
            return { success: false, error: 'Item not found', item: null }
        }

        const item = await prisma.databaseItem.update({
            where: { id },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.icon !== undefined && { icon: data.icon }),
                ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
                ...(data.properties !== undefined && { properties: data.properties }),
                ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
            },
        })

        revalidatePath(`/private/${existing.block.page.id}`)

        return { success: true, item }
    } catch (error) {
        console.error('Error updating database item:', error)
        return { success: false, error: 'Failed to update item', item: null }
    }
}

// ========================================
// DELETE DATABASE ITEM
// ========================================

export async function deleteDatabaseItem(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify ownership
        const existing = await prisma.databaseItem.findFirst({
            where: { id },
            include: {
                block: { include: { page: { select: { userId: true, id: true } } } },
            },
        })

        if (!existing || existing.block.page.userId !== user.id) {
            return { success: false, error: 'Item not found' }
        }

        await prisma.databaseItem.delete({
            where: { id },
        })

        revalidatePath(`/private/${existing.block.page.id}`)

        return { success: true }
    } catch (error) {
        console.error('Error deleting database item:', error)
        return { success: false, error: 'Failed to delete item' }
    }
}

// ========================================
// GET DATABASE PROPERTIES
// ========================================

export async function getDatabaseProperties(blockId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', properties: [] }
        }

        const properties = await prisma.databaseProperty.findMany({
            where: { blockId },
            orderBy: { sortOrder: 'asc' },
        })

        return { success: true, properties }
    } catch (error) {
        console.error('Error fetching database properties:', error)
        return { success: false, error: 'Failed to fetch properties', properties: [] }
    }
}

// ========================================
// CREATE DATABASE PROPERTY
// ========================================

export async function createDatabaseProperty(blockId: string, name: string, type: string = 'TEXT') {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', property: null }
        }

        // Verify block ownership
        const block = await prisma.block.findFirst({
            where: { id: blockId },
            include: { page: { select: { userId: true, id: true } } },
        })

        if (!block || block.page.userId !== user.id) {
            return { success: false, error: 'Block not found', property: null }
        }

        // Get max sort order
        const maxSort = await prisma.databaseProperty.aggregate({
            where: { blockId },
            _max: { sortOrder: true },
        })
        const sortOrder = (maxSort._max.sortOrder || 0) + 1

        const property = await prisma.databaseProperty.create({
            data: {
                blockId,
                name,
                type: type as any,
                sortOrder,
            },
        })

        revalidatePath(`/private/${block.page.id}`)

        return { success: true, property }
    } catch (error) {
        console.error('Error creating database property:', error)
        return { success: false, error: 'Failed to create property', property: null }
    }
}

// ========================================
// UPDATE DATABASE PROPERTY
// ========================================

export async function updateDatabaseProperty(
    id: string,
    data: { name?: string; type?: string; options?: any[] }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized', property: null }
        }

        const property = await prisma.databaseProperty.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.type !== undefined && { type: data.type as any }),
                ...(data.options !== undefined && { options: data.options }),
            },
        })

        return { success: true, property }
    } catch (error) {
        console.error('Error updating database property:', error)
        return { success: false, error: 'Failed to update property', property: null }
    }
}

// ========================================
// DELETE DATABASE PROPERTY
// ========================================

export async function deleteDatabaseProperty(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        await prisma.databaseProperty.delete({
            where: { id },
        })

        return { success: true }
    } catch (error) {
        console.error('Error deleting database property:', error)
        return { success: false, error: 'Failed to delete property' }
    }
}

// ========================================
// INITIALIZE DEFAULT PROPERTIES
// ========================================

export async function initializeDatabaseProperties(blockId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check if properties already exist
        const existingCount = await prisma.databaseProperty.count({
            where: { blockId },
        })

        if (existingCount > 0) {
            return { success: true, message: 'Properties already exist' }
        }

        // Create default "Status" property with options
        await prisma.databaseProperty.create({
            data: {
                blockId,
                name: 'Status',
                type: 'SELECT',
                options: [
                    { id: 'not_started', name: 'Not started', color: 'gray' },
                    { id: 'in_progress', name: 'In progress', color: 'blue' },
                    { id: 'done', name: 'Done', color: 'green' },
                ],
                sortOrder: 0,
            },
        })

        return { success: true }
    } catch (error) {
        console.error('Error initializing database properties:', error)
        return { success: false, error: 'Failed to initialize properties' }
    }
}
