'use server'

import { parseTaskInput } from './ai'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type AIActionResponse = {
    success: boolean
    task?: any
    error?: string
}

export async function createTaskFromNaturalLanguage(input: string, userId: string): Promise<AIActionResponse> {
    try {
        const parsedData = await parseTaskInput(input)

        if (!parsedData) {
            return { success: false, error: 'Failed to parse task input' }
        }

        const task = await prisma.task.create({
            data: {
                title: parsedData.title,
                description: parsedData.description,
                priority: parsedData.priority?.toLowerCase() || 'medium', // Default to medium
                dueDate: parsedData.dueDate ? new Date(parsedData.dueDate) : undefined,
                userId: userId,
                // We're not doing project matching yet, but could be added here
            }
        })

        revalidatePath('/dashboard')
        revalidatePath('/inbox')
        revalidatePath('/today')

        return { success: true, task }

    } catch (error) {
        console.error('Error creating task from NL:', error)
        return { success: false, error: 'Internal server error' }
    }
}
