import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { withErrorHandler, createApiResponse, createErrorResponse } from '@/lib/api-handler'
import { AppError, ErrorCodes, ErrorMessages } from '@/lib/error-handler'

async function handler(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new AppError(
            ErrorMessages.UNAUTHORIZED,
            ErrorCodes.UNAUTHORIZED,
            401,
            ErrorMessages.UNAUTHORIZED
        )
    }

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')

    if (!source) {
        throw new AppError(
            'Source type required',
            ErrorCodes.VALIDATION_ERROR,
            400,
            'Please specify a data source type'
        )
    }

    let data: any[] = []

    switch (source.toUpperCase()) {
        case 'TASKS':
            const tasks = await prisma.task.findMany({
                where: { userId: user.id },
                select: {
                    id: true,
                    title: true,
                    priority: true,
                    dueDate: true,
                    completed: true,
                    completedAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            })
            data = tasks.map(t => ({
                ...t,
                status: t.completed ? 'DONE' : 'TODO',
            }))
            break



        case 'HABITS':
            const habits = await prisma.habit.findMany({
                where: { userId: user.id },
                select: {
                    id: true,
                    name: true,
                    frequency: true,
                    currentStreak: true,
                    icon: true,
                    color: true,
                    isActive: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            })
            data = habits.map(h => ({
                ...h,
                title: h.name,
                streak: h.currentStreak,
                status: h.isActive ? 'Active' : 'Inactive',
            }))
            break

        default:
            throw new AppError(
                'Invalid source type',
                ErrorCodes.VALIDATION_ERROR,
                400,
                'The specified data source type is not supported'
            )
    }

    return createApiResponse({ data })
}

export const GET = withErrorHandler(handler)
