'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { Task } from '@prisma/client'
import { updateStreak } from '@/lib/actions/activity'
import { AppError, ErrorCodes, ErrorMessages } from '@/lib/error-handler'
import { getNextOccurrence, type RecurrenceInterval } from '@/lib/utils/recurrence'
import { assertRelationsOwned } from '@/lib/security/ownership'

// Schemas
const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().nullable(),
    dueDate: z.string().optional().nullable(), // Passed as ISO string
    scheduledStart: z.string().optional().nullable(), // ISO string for scheduled start time
    scheduledEnd: z.string().optional().nullable(), // ISO string for scheduled end time
    durationMinutes: z.number().optional(),
    tagIds: z.array(z.string()).optional(),
    // Project & Section
    projectId: z.string().optional().nullable(),
    sectionId: z.string().optional().nullable(),
    // Recurrence
    isRecurring: z.boolean().optional(),
    recurrenceInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
    recurrenceStep: z.number().optional(),
    recurrenceDays: z.array(z.number()).optional(),
    recurrenceEnd: z.string().optional().nullable(),
    // Reminder
    reminderPattern: z.string().optional(),
})

const updateTaskSchema = createTaskSchema.partial().extend({
    id: z.string(),
    completed: z.boolean().optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

// Actions

export interface GetTasksOptions {
    completed?: boolean
    dateRange?: {
        start: Date
        end: Date
    }
    limit?: number
}

export async function getTasks(options: GetTasksOptions = {}) {
    try {
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

        const where: any = {
            userId: user.id,
        }

        // Apply filters


        if (options.completed !== undefined) {
            where.completed = options.completed
        }

        if (options.dateRange) {
            where.dueDate = {
                gte: options.dateRange.start,
                lte: options.dateRange.end,
            }
        }

        const tasks = await prisma.task.findMany({
            where,
            select: {
                id: true,
                userId: true,
                title: true,
                description: true,
                priority: true,
                dueDate: true,
                completed: true,
                completedAt: true,

                scheduledStart: true,
                scheduledEnd: true,
                durationMinutes: true,
                sortOrder: true,
                createdAt: true,
                updatedAt: true,
                // Recurrence
                isRecurring: true,
                recurrenceInterval: true,
                recurrenceStep: true,
                recurrenceDays: true,
                recurrenceEnd: true,
                tags: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                            }
                        }
                    }
                },
                subtasks: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                        sortOrder: true,
                    },
                    orderBy: {
                        sortOrder: 'asc'
                    }
                },
                reminders: {
                    select: {
                        id: true,
                        remindAt: true,
                        isSent: true,
                    },
                },

            },
            orderBy: [
                { completed: 'asc' },
                { sortOrder: 'asc' },
                { createdAt: 'desc' }
            ],
            take: options.limit,
        })

        return { success: true, data: tasks }
    } catch (error) {
        console.error('getTasks error:', error)

        if (error instanceof AppError) {
            return { success: false, error: error.userMessage || error.message, data: [] }
        }

        return { success: false, error: ErrorMessages.DATABASE_ERROR, data: [] }
    }
}

export async function getTaskById(taskId: string) {
    try {
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

        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                userId: user.id,
            },
            include: {
                user: {
                    select: {
                        displayName: true,
                        email: true,
                        avatarUrl: true
                    }
                },
                subtasks: {
                    orderBy: { sortOrder: 'asc' },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        })

        if (!task) {
            return { success: false, error: 'Task not found', task: null }
        }

        return { success: true, task }
    } catch (error) {
        console.error('getTaskById error:', error)

        if (error instanceof AppError) {
            return { success: false, error: error.userMessage || error.message, task: null }
        }

        return { success: false, error: ErrorMessages.DATABASE_ERROR, task: null }
    }
}

export async function createTask(data: CreateTaskInput) {
    try {
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

        const result = createTaskSchema.safeParse(data)

        if (!result.success) {
            console.error('createTask: Validation failed', result.error.flatten().fieldErrors)
            throw new AppError(
                'Validation failed',
                ErrorCodes.VALIDATION_ERROR,
                400,
                ErrorMessages.VALIDATION_ERROR
            )
        }

        // Zod checked the shape; this checks the owner. Must run before the write.
        await assertRelationsOwned(prisma, user.id, {
            projectId: result.data.projectId,
            sectionId: result.data.sectionId,
            tagIds: result.data.tagIds,
        })

        // Ensure profile exists before creating task
        await prisma.profile.upsert({
            where: { id: user.id },
            update: {},
            create: {
                id: user.id,
                email: user.email!,
                displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
            }
        })

        const task = await prisma.task.create({
            data: {
                userId: user.id,
                title: result.data.title,
                description: result.data.description,
                priority: result.data.priority || null,
                dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
                scheduledStart: result.data.scheduledStart ? new Date(result.data.scheduledStart) : null,
                scheduledEnd: result.data.scheduledEnd ? new Date(result.data.scheduledEnd) : null,
                durationMinutes: result.data.durationMinutes || null,
                // Project & Section
                projectId: result.data.projectId || null,
                sectionId: result.data.sectionId || null,
                tags: result.data.tagIds ? {
                    create: result.data.tagIds.map(tagId => ({
                        tag: { connect: { id: tagId } }
                    }))
                } : undefined,
                // Recurrence
                isRecurring: result.data.isRecurring || false,
                recurrenceInterval: result.data.recurrenceInterval,
                recurrenceStep: result.data.recurrenceStep,
                recurrenceDays: result.data.recurrenceDays || [],
                recurrenceEnd: result.data.recurrenceEnd ? new Date(result.data.recurrenceEnd) : null,
            },
        })

        ; (revalidateTag as any)(`tasks-${user.id}`)
        revalidatePath('/', 'layout')
        return { success: true, data: task }
    } catch (error) {
        console.error('createTask error:', error)

        if (error instanceof AppError) {
            return { success: false, error: error.userMessage || error.message }
        }

        return { success: false, error: 'Failed to create task. Please try again.' }
    }
}

export async function updateTask(data: UpdateTaskInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const result = updateTaskSchema.safeParse(data)

        if (!result.success) {
            return { success: false, error: result.error.flatten().fieldErrors as any }
        }

        // Build update data with proper null handling
        const updateData: any = {}
        if (result.data.title !== undefined) updateData.title = result.data.title
        if (result.data.description !== undefined) updateData.description = result.data.description
        if (result.data.priority !== undefined) updateData.priority = result.data.priority
        if (result.data.dueDate !== undefined) {
            updateData.dueDate = result.data.dueDate ? new Date(result.data.dueDate) : null
        }
        if (result.data.completed !== undefined) {
            updateData.completed = result.data.completed
            updateData.completedAt = result.data.completed ? new Date() : null
        }

        if (result.data.scheduledStart !== undefined) {
            updateData.scheduledStart = result.data.scheduledStart ? new Date(result.data.scheduledStart) : null
        }
        if (result.data.scheduledEnd !== undefined) {
            updateData.scheduledEnd = result.data.scheduledEnd ? new Date(result.data.scheduledEnd) : null
        }
        if (result.data.durationMinutes !== undefined) updateData.durationMinutes = result.data.durationMinutes

        if (result.data.isRecurring !== undefined) updateData.isRecurring = result.data.isRecurring
        if (result.data.recurrenceInterval !== undefined) updateData.recurrenceInterval = result.data.recurrenceInterval
        if (result.data.recurrenceStep !== undefined) updateData.recurrenceStep = result.data.recurrenceStep
        if (result.data.recurrenceDays !== undefined) {
            // Ensure we store an array, defaulting to empty if null/undefined provided but field is present
            updateData.recurrenceDays = result.data.recurrenceDays || []
        }
        if (result.data.recurrenceEnd !== undefined) {
            updateData.recurrenceEnd = result.data.recurrenceEnd ? new Date(result.data.recurrenceEnd) : null
        }

        // Project & Section
        if (result.data.projectId !== undefined) updateData.projectId = result.data.projectId
        if (result.data.sectionId !== undefined) updateData.sectionId = result.data.sectionId

        // Moving a task out of a project must also drop its section, otherwise the
        // task keeps a section pointing into a project it no longer belongs to and
        // stops appearing in every grouped view.
        if (result.data.projectId === null && result.data.sectionId === undefined) {
            updateData.sectionId = null
        }

        const task = await prisma.$transaction(async (tx) => {
            // Verify ownership first
            const existing = await tx.task.findUnique({
                where: { id: result.data.id },
                select: { userId: true, projectId: true }
            })

            if (!existing || existing.userId !== user.id) {
                throw new AppError('Task not found', ErrorCodes.NOT_FOUND, 404)
            }

            // Owning the task is not enough — the relations it is being pointed at
            // must belong to the same user. Inside the transaction so the check and
            // the write see the same snapshot.
            await assertRelationsOwned(tx, user.id, {
                projectId: result.data.projectId,
                sectionId: updateData.sectionId,
                tagIds: result.data.tagIds,
                fallbackProjectId: existing.projectId,
            })

            if (result.data.tagIds !== undefined) {
                // First delete existing tags
                await tx.taskTag.deleteMany({
                    where: { taskId: result.data.id }
                });

                // Then create new associations
                if (result.data.tagIds && result.data.tagIds.length > 0) {
                    updateData.tags = {
                        create: result.data.tagIds.map(tagId => ({
                            tag: { connect: { id: tagId } }
                        }))
                    };
                }
            }

            return await tx.task.update({
                where: {
                    id: result.data.id,
                },
                data: updateData,
                include: {
                    user: {
                        select: {
                            displayName: true,
                            email: true,
                            avatarUrl: true
                        }
                    },
                    tags: {
                        include: {
                            tag: true
                        }
                    }
                }
            })
        })

        // Update streak if task was just completed
        if (result.data.completed === true) {
            await updateStreak()
        }

        ; (revalidateTag as any)(`tasks-${user.id}`)
        revalidatePath('/', 'layout')
        return { success: true, data: task }
    } catch (error: any) {
        console.error('updateTask: Database error', error)

        // Ownership and validation failures carry their own user-facing message
        if (error instanceof AppError) {
            return { success: false, error: error.userMessage || error.message }
        }

        // Handle Prisma specific errors
        if (error.code === 'P2025') {
            return { success: false, error: 'Task not found or you do not have permission to update it' }
        }
        if (error.code === 'P2003') {
            return { success: false, error: 'Invalid project or section ID' }
        }

        return { success: false, error: 'Failed to update task' }
    }
}

export async function updateTaskOrder(tasks: { id: string; sortOrder: number }[]) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        if (!tasks || tasks.length === 0) {
            return { success: true }
        }

        await prisma.$transaction(
            tasks.map(task =>
                prisma.task.update({
                    where: { id: task.id, userId: user.id },
                    data: {
                        sortOrder: task.sortOrder,
                    }
                })
            )
        )

            ; (revalidateTag as any)(`tasks-${user.id}`)
        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error: any) {
        console.error('updateTaskOrder: Database error', error)
        return { success: false, error: 'Failed to update task order' }
    }
}

export async function toggleTaskCompletion(id: string, completed: boolean) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }



        // Need more fields for recurrence logic
        const currentTask = await prisma.task.findUnique({
            where: { id },
        })

        if (!currentTask) return { success: false, error: 'Task not found' }
        if (currentTask.userId !== user.id) return { success: false, error: 'Permission denied' }

        const task = await prisma.task.update({
            where: { id },
            data: {
                completed,
                completedAt: completed ? new Date() : null,
            }
        })

        // Handle Recurrence (Loop)
        if (completed && currentTask.isRecurring && currentTask.recurrenceInterval && currentTask.dueDate) {
            await handleRecurringTaskCompletion(currentTask, user.id)
        }

        // Update streak if task was just completed
        if (completed) {
            await updateStreak()
        }

        ; (revalidateTag as any)(`tasks-${user.id}`)
        revalidatePath('/', 'layout')
        return { success: true, data: task }
    } catch (error: any) {
        console.error('toggleTaskCompletion: Database error', error)

        if (error.code === 'P2025') {
            return { success: false, error: 'Task not found or you do not have permission to modify it' }
        }

        return { success: false, error: 'Failed to toggle task completion' }
    }
}

export async function deleteTask(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Delete task. Subtasks aren't implemented in the schema yet, 
        // but if they were, they'd be handled here.
        const currentTask = await prisma.task.findUnique({
            where: { id },
            select: { userId: true }
        })

        if (!currentTask) return { success: false, error: 'Task not found' }
        if (currentTask.userId !== user.id) return { success: false, error: 'Permission denied' }

        await prisma.task.delete({
            where: { id }
        })

            ; (revalidateTag as any)(`tasks-${user.id}`)
        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error: any) {
        console.error('deleteTask: Database error', error)

        if (error.code === 'P2025') {
            return { success: false, error: 'Task not found or you do not have permission to delete it' }
        }

        return { success: false, error: 'Failed to delete task' }
    }
}

/**
 * Create task from natural language input
 * Supports Todoist-style syntax: #project @tag p1-p4 !reminder dates
 */
export async function createTaskFromNaturalLanguage(input: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Import parser dynamically to avoid server/client issues
        const { parseTaskNaturalLanguage, calculateReminderTime } = await import('@/lib/parsers/task-parser')

        // Get user's projects and tags for context
        const tags = await prisma.tag.findMany({
            where: { userId: user.id },
            select: { id: true, name: true },
        })

        // Parse the input
        const parsed = parseTaskNaturalLanguage(input, {
            currentDate: new Date(),
            availableTags: tags,
        })



        // Match tags by name and auto-create if needed
        const tagIds: string[] = []
        for (const tagName of parsed.tagNames) {
            let tag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())

            if (!tag) {
                // Auto-create tag
                tag = await prisma.tag.create({
                    data: {
                        userId: user.id,
                        name: tagName,
                    },
                })
            }

            tagIds.push(tag.id)
        }

        // Ensure profile exists
        await prisma.profile.upsert({
            where: { id: user.id },
            update: {},
            create: {
                id: user.id,
                email: user.email!,
                displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
            },
        })

        // Create the task
        const task = await prisma.task.create({
            data: {
                userId: user.id,
                title: parsed.title,
                priority: parsed.priority,
                dueDate: parsed.dueDate,
                // Recurrence
                isRecurring: !!parsed.recurrence,
                recurrenceInterval: parsed.recurrence?.interval,
                recurrenceStep: parsed.recurrence?.step,
                recurrenceDays: parsed.recurrence?.days || [],
                tags: tagIds.length > 0
                    ? {
                        create: tagIds.map((tagId) => ({
                            tag: {
                                connect: { id: tagId },
                            },
                        })),
                    }
                    : undefined,
            },
            include: {
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        })

        // Create reminder if specified
        if (parsed.reminderPattern && parsed.dueDate) {
            const reminderTime = calculateReminderTime(parsed.dueDate, parsed.reminderPattern)
            if (reminderTime) {
                await prisma.reminder.create({
                    data: {
                        taskId: task.id,
                        remindAt: reminderTime,
                    },
                })
            }
        }



        ; (revalidateTag as any)(`tasks-${user.id}`)
        revalidatePath('/', 'layout')
        return { success: true, data: task }
    } catch (error) {
        console.error('Error creating task from natural language:', error)
        return { success: false, error: 'Failed to create task' }
    }
}


export async function searchTasks(query: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized', data: [] }
        }

        if (!query || query.trim().length < 2) {
            return { success: true, data: [] }
        }

        const tasks = await prisma.task.findMany({
            where: {
                userId: user.id,
                OR: [
                    { title: { contains: query.trim(), mode: 'insensitive' } },
                    { description: { contains: query.trim(), mode: 'insensitive' } }
                ]
            },
            take: 10,
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                userId: true,
                title: true,
                description: true,
                priority: true,
                dueDate: true,
                completed: true,
                completedAt: true,

                scheduledStart: true,
                scheduledEnd: true,
                durationMinutes: true,
                createdAt: true,
                updatedAt: true,

                // Recurrence
                isRecurring: true,
                recurrenceInterval: true,
                recurrenceStep: true,
                recurrenceDays: true,
                recurrenceEnd: true,

                tags: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                            }
                        }
                    }
                },
                subtasks: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                        sortOrder: true,
                    },
                    orderBy: {
                        sortOrder: 'asc'
                    }
                },
                reminders: {
                    select: {
                        id: true,
                        remindAt: true,
                        isSent: true,
                    },
                },
            }
        })

        return { success: true, data: tasks }
    } catch (error) {
        console.error('searchTasks: Database error', error)
        return { success: false, error: 'Failed to search tasks', data: [] }
    }
}

export async function getSidebarCounts() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized', data: { inbox: 0, today: 0, overdue: 0 } }
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // Run queries in parallel for performance
        const [inboxCount, todayCount, overdueCount] = await Promise.all([
            // Inbox: Undated tasks or tasks before today (past due)
            // Note: This matches the logic in src/app/(app)/inbox/page.tsx
            prisma.task.count({
                where: {
                    userId: user.id,
                    completed: false,
                    OR: [
                        { dueDate: null },
                        { dueDate: { lt: today } }
                    ]
                }
            }),

            // Today: Due today (start of day to end of day)
            prisma.task.count({
                where: {
                    userId: user.id,
                    completed: false,
                    dueDate: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            }),

            // Overdue: Only strict overdue (before today) - kept separate just in case we need it specifically later
            prisma.task.count({
                where: {
                    userId: user.id,
                    completed: false,
                    dueDate: { lt: today }
                }
            })
        ])

        return {
            success: true,
            data: {
                inbox: inboxCount,
                today: todayCount,
                overdue: overdueCount
            }
        }
    } catch (error) {
        console.error('getSidebarCounts: Database error', error)
        return { success: false, error: 'Failed to fetch counts', data: { inbox: 0, today: 0, overdue: 0 } }
    }
}

export async function bulkUpdateTasks(ids: string[], data: Partial<UpdateTaskInput>) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        if (ids.length === 0) return { success: true }

        // Construct update data
        const updateData: any = {}
        if (data.priority !== undefined && data.priority !== null) updateData.priority = data.priority
        if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
        if (data.completed !== undefined) {
            updateData.completed = data.completed
            updateData.completedAt = data.completed ? new Date() : null
        }

        await prisma.task.updateMany({
            where: {
                id: { in: ids },
                userId: user.id
            },
            data: updateData
        })

            ; (revalidateTag as any)(`tasks-${user.id}`)
        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error) {
        console.error('bulkUpdateTasks error:', error)
        return { success: false, error: 'Failed to update tasks' }
    }
}

export async function bulkDeleteTasks(ids: string[]) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        if (ids.length === 0) return { success: true }

        await prisma.task.deleteMany({
            where: {
                id: { in: ids },
                userId: user.id
            }
        })

            ; (revalidateTag as any)(`tasks-${user.id}`)
        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error) {
        console.error('bulkDeleteTasks error:', error)
        return { success: false, error: 'Failed to delete tasks' }
    }
}

/**
 * Handle logic for completing a recurring task
 * Creates the next instance of the task
 */
/**
 * Handle logic for completing a recurring task
 * Creates the next instance of the task
 */
async function handleRecurringTaskCompletion(task: Task, userId: string) {
    try {
        if (!task.dueDate || !task.recurrenceInterval) return

        // Date maths lives in lib/utils/recurrence so it can be unit tested without
        // a database. It also skips past occurrences, so completing a long-neglected
        // recurring task schedules the next one for today rather than for a date
        // that is already overdue.
        const nextDate = getNextOccurrence(task.dueDate, {
            interval: task.recurrenceInterval as RecurrenceInterval,
            step: task.recurrenceStep,
            days: task.recurrenceDays,
            end: task.recurrenceEnd,
        })

        // null means the rule is exhausted (past recurrenceEnd) — stop the chain.
        if (!nextDate) return

        const inheritedTags = await prisma.taskTag.findMany({
            where: { taskId: task.id },
            select: { tagId: true },
        })

        await prisma.task.create({
            data: {
                userId,
                title: task.title,
                description: task.description,
                priority: task.priority,
                dueDate: nextDate,
                durationMinutes: task.durationMinutes,
                // Stay in the same project and section. Without this a recurring task
                // silently falls out of its project on every completion.
                projectId: task.projectId,
                sectionId: task.sectionId,
                // Inherit recurrence settings
                isRecurring: true,
                recurrenceInterval: task.recurrenceInterval,
                recurrenceStep: task.recurrenceStep,
                recurrenceDays: task.recurrenceDays,
                recurrenceEnd: task.recurrenceEnd,
                // Copy tags
                tags: {
                    create: inheritedTags.map(tt => ({
                        tag: { connect: { id: tt.tagId } }
                    }))
                }
            }
        })
    } catch (error) {
        console.error('Failed to create next recurring task:', error)
    }
}

/**
 * Get all tasks for a specific project
 */
export async function getTasksByProject(projectId: string, sectionId?: string | null) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized', data: [] }
        }

        const where: any = {
            userId: user.id,
            projectId,
        }

        // Filter by section if provided
        if (sectionId !== undefined) {
            where.sectionId = sectionId
        }

        const tasks = await prisma.task.findMany({
            where,
            select: {
                id: true,
                userId: true,
                title: true,
                description: true,
                priority: true,
                dueDate: true,
                completed: true,
                completedAt: true,
                scheduledStart: true,
                scheduledEnd: true,
                durationMinutes: true,
                sortOrder: true,
                createdAt: true,
                updatedAt: true,
                projectId: true,
                sectionId: true,
                // Recurrence
                isRecurring: true,
                recurrenceInterval: true,
                recurrenceStep: true,
                recurrenceDays: true,
                recurrenceEnd: true,
                tags: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                            }
                        }
                    }
                },
                subtasks: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                        sortOrder: true,
                    },
                    orderBy: {
                        sortOrder: 'asc'
                    }
                },
            },
            orderBy: [
                { completed: 'asc' },
                { sortOrder: 'asc' },
                { createdAt: 'desc' }
            ],
        })

        return { success: true, data: tasks }
    } catch (error) {
        console.error('getTasksByProject error:', error)
        return { success: false, error: 'Failed to fetch tasks', data: [] }
    }
}
