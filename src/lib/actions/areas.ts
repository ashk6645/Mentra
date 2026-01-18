'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const areaSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    icon: z.string().optional(),
    color: z.string().optional(),
})

export async function getAreas() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const areas = await prisma.areaOfLife.findMany({
            where: {
                userId: user.id
            },
            orderBy: {
                sortOrder: 'asc'
            },
            include: {
                projects: true
            }
        })
        return areas
    } catch (error) {
        console.error('Failed to fetch areas:', error)
        return []
    }
}

export async function createArea(data: z.infer<typeof areaSchema>) {
    console.log('createArea called with:', data)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error('createArea: Unauthorized')
        return { success: false, error: 'Unauthorized' }
    }

    const validation = areaSchema.safeParse(data)
    if (!validation.success) {
        console.error('createArea: Validation failed', validation.error)
        return { success: false, error: validation.error.format() }
    }

    try {
        const area = await prisma.areaOfLife.create({
            data: {
                userId: user.id,
                name: data.name,
                icon: data.icon,
                color: data.color
            }
        })
        console.log('createArea: Success', area)

        revalidatePath('/areas')
        return { success: true, data: area }
    } catch (error) {
        console.error('createArea: Database error', error)
        return { success: false, error: 'Failed to create area' }
    }
}

export async function updateArea(id: string, data: Partial<z.infer<typeof areaSchema>>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const area = await prisma.areaOfLife.update({
            where: {
                id,
                userId: user.id
            },
            data
        })

        revalidatePath('/areas')
        return { success: true, data: area }
    } catch (error) {
        return { success: false, error: 'Failed to update area' }
    }
}

export async function deleteArea(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        await prisma.areaOfLife.delete({
            where: {
                id,
                userId: user.id
            }
        })

        revalidatePath('/areas')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to delete area' }
    }
}
