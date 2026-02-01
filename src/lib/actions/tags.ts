'use server'

import { revalidatePath, unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const createTagSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    color: z.string().optional(),
})

// Cached version of getTags for better performance
const getCachedTagsForUser = unstable_cache(
    async (userId: string) => {
        const tags = await prisma.tag.findMany({
            where: { userId },
            orderBy: { name: 'asc' }
        })
        return tags
    },
    ['user-tags'],
    { revalidate: 3600 } // Cache for 1 hour
)

export async function getTags() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    return getCachedTagsForUser(user.id)
}

export async function createTag(data: z.infer<typeof createTagSchema>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const result = createTagSchema.safeParse(data)

    if (!result.success) {
        return { error: result.error.flatten() }
    }

    try {
        const tag = await prisma.tag.create({
            data: {
                userId: user.id,
                name: result.data.name,
                color: result.data.color,
            },
        })

        revalidatePath('/tags')
        revalidatePath('/', 'layout') // Revalidate cached tags
        return { success: true, data: tag }
    } catch (error) {
        return { error: 'Failed to create tag' }
    }
}

export async function deleteTag(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    try {
        await prisma.tag.delete({
            where: {
                id,
                userId: user.id
            }
        })
        revalidatePath('/tags')
        revalidatePath('/', 'layout') // Revalidate cached tags
        return { success: true }
    } catch (error) {
        return { error: 'Failed to delete tag' }
    }
}

export async function toggleTagOnTask(taskId: string, tagId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    try {
        // Check if exists
        const existing = await prisma.taskTag.findUnique({
            where: {
                taskId_tagId: {
                    taskId,
                    tagId
                }
            }
        })

        if (existing) {
            await prisma.taskTag.delete({
                where: {
                    taskId_tagId: {
                        taskId,
                        tagId
                    }
                }
            })
        } else {
            await prisma.taskTag.create({
                data: {
                    taskId,
                    tagId
                }
            })
        }

        revalidatePath('/tasks')
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to toggle tag' }
    }
}
