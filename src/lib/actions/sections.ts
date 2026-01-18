'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const createSectionSchema = z.object({
    projectId: z.string(),
    name: z.string().min(1, 'Name is required'),
})

export async function createSection(data: z.infer<typeof createSectionSchema>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    try {
        // Get max sort order
        const maxOrder = await prisma.section.aggregate({
            where: { projectId: data.projectId },
            _max: { sortOrder: true }
        })

        const order = (maxOrder._max.sortOrder || 0) + 1

        const section = await prisma.section.create({
            data: {
                projectId: data.projectId,
                name: data.name,
                sortOrder: order
            }
        })

        revalidatePath(`/projects/${data.projectId}`)
        return { success: true, data: section }
    } catch (error) {
        return { error: 'Failed to create section' }
    }
}

export async function deleteSection(id: string, projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    try {
        await prisma.section.delete({
            where: { id }
        })
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error) {
        return { error: 'Failed to delete section' }
    }
}

export async function updateSectionOrder(sections: { id: string; sortOrder: number }[], projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    try {
        // Transaction to update all
        await prisma.$transaction(
            sections.map(section =>
                prisma.section.update({
                    where: { id: section.id },
                    data: { sortOrder: section.sortOrder }
                })
            )
        )
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error) {
        return { error: 'Failed to reorder sections' }
    }
}
