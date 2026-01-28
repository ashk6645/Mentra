'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { AppError, ErrorCodes, ErrorMessages } from '@/lib/error-handler'

const createProjectSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    areaId: z.string().optional(),
    templateId: z.string().optional(),
    sections: z.array(z.string()).optional(),
    starterTasks: z.array(z.object({
        title: z.string(),
        sectionIndex: z.number(),
    })).optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export async function getProjects(userId?: string) {
    if (!userId) {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            console.log('[getProjects] No user found')
            return []
        }
        userId = user.id
        console.log('[getProjects] Fetching for user:', userId)
    } else {
        // console.log('[getProjects] Using provided userId:', userId)
    }

    return await prisma.project.findMany({
        where: {
            OR: [
                { userId: userId }, // Owned
                { sharedWith: { some: { sharedWithUserId: userId } } } // Shared
            ]
        },
        select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            sortOrder: true,
            userId: true, // Needed to distinguish ownership
        },
        orderBy: {
            sortOrder: 'asc'
        }
    })
}

export async function getProjectsForBoard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { userId: user.id },
                { sharedWith: { some: { sharedWithUserId: user.id } } }
            ]
        },
        include: {
            tasks: {
                select: {
                    completed: true
                }
            }
        },
        orderBy: {
            sortOrder: 'asc'
        }
    })

    return projects.map(project => {
        const totalTasks = project.tasks.length
        const completedTasks = project.tasks.filter(t => t.completed).length
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        return {
            ...project,
            tasks: undefined, // Remove tasks array to keep payload light
            progress,
            totalTasks,
            completedTasks
        }
    })
}

export async function createProject(data: CreateProjectInput) {
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

        const result = createProjectSchema.safeParse(data)

        if (!result.success) {
            throw new AppError(
                'Validation failed',
                ErrorCodes.VALIDATION_ERROR,
                400,
                ErrorMessages.VALIDATION_ERROR
            )
        }

        const trimmedName = result.data.name.trim()
        if (trimmedName.length === 0) {
            throw new AppError(
                'Project name cannot be empty',
                ErrorCodes.VALIDATION_ERROR,
                400,
                'Project name cannot be empty'
            )
        }

        if (trimmedName.length > 100) {
            throw new AppError(
                'Project name too long',
                ErrorCodes.VALIDATION_ERROR,
                400,
                'Project name must be less than 100 characters'
            )
        }

        const project = await prisma.$transaction(async (tx) => {
            const newProject = await tx.project.create({
                data: {
                    userId: user.id,
                    name: trimmedName,
                    description: result.data.description || null,
                    color: result.data.color || null,
                    icon: result.data.icon || null,
                    areaId: result.data.areaId || null,
                },
            })

            if (result.data.sections?.length) {
                await tx.section.createMany({
                    data: result.data.sections.map((name, index) => ({
                        projectId: newProject.id,
                        name: name.trim(),
                        sortOrder: index,
                    })),
                })

                if (result.data.starterTasks?.length) {
                    const sections = await tx.section.findMany({
                        where: { projectId: newProject.id },
                        orderBy: { sortOrder: 'asc' },
                        select: { id: true },
                    })

                    await tx.task.createMany({
                        data: result.data.starterTasks.map((task, index) => ({
                            userId: user.id,
                            projectId: newProject.id,
                            sectionId:
                                sections[task.sectionIndex]?.id ??
                                sections[0]?.id ??
                                null,
                            title: task.title.trim(),
                            sortOrder: index,
                        })),
                    })
                }
            }

            return newProject
        })

            ; (revalidateTag as any)(`projects-${user.id}`)
        revalidatePath('/', 'layout')
        revalidatePath('/projects')
        revalidatePath('/dashboard')

        return { success: true, data: project }
    } catch (error: any) {
        console.error('Failed to create project:', error)

        if (error instanceof AppError) {
            return { success: false, error: error.userMessage || error.message }
        }

        if (error.code === 'P2003') {
            return { success: false, error: 'Invalid area selected' }
        }

        return { success: false, error: `Failed to create project: ${error.message}` }
    }
}


export async function getProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    if (!id || typeof id !== 'string') return null

    const project = await prisma.project.findUnique({
        where: {
            id,
            OR: [
                { userId: user.id },
                { sharedWith: { some: { sharedWithUserId: user.id } } }
            ]
        },
        select: {
            id: true,
            userId: true,
            name: true,
            description: true,
            color: true,
            icon: true,
            status: true,
            priority: true,
            startDate: true,
            targetDate: true,
            areaId: true,
            sortOrder: true,
            isArchived: true,
            createdAt: true,
            updatedAt: true,
            sharedWith: {
                where: { sharedWithUserId: user.id },
                select: { permission: true }
            },
            sections: {
                select: {
                    id: true,
                    name: true,
                    sortOrder: true,
                    tasks: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            completed: true,
                            priority: true,
                            dueDate: true,
                            sortOrder: true,
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
                            }
                        },
                        orderBy: { sortOrder: 'asc' },
                    }
                },
                orderBy: {
                    sortOrder: 'asc'
                },
            },
            tasks: {
                where: {
                    sectionId: null // Get tasks without section
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    completed: true,
                    priority: true,
                    dueDate: true,
                    sortOrder: true,
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
                    }
                },
                orderBy: { sortOrder: 'asc' },
            }
        }
    })

    if (!project) return null

    // Calculate permission
    let currentUserPermission = 'view'
    if (project.userId === user.id) {
        currentUserPermission = 'owner'
    } else if (project.sharedWith.length > 0) {
        currentUserPermission = project.sharedWith[0].permission
    }

    return { ...project, currentUserPermission }
}

export async function deleteProject(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        if (!id || typeof id !== 'string') {
            return { success: false, error: 'Invalid project ID' }
        }

        await prisma.project.delete({
            where: {
                id,
                userId: user.id
            }
        })

            ; (revalidateTag as any)(`projects-${user.id}`)
        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to delete project:', error)

        if (error.code === 'P2025') {
            return { success: false, error: 'Project not found or access denied' }
        }

        return { success: false, error: 'Failed to delete project' }
    }
}

export async function updateProject(id: string, data: Partial<CreateProjectInput>) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        if (!id || typeof id !== 'string') {
            return { success: false, error: 'Invalid project ID' }
        }

        // Validate name if provided
        if (data.name !== undefined) {
            const trimmedName = data.name.trim()
            if (trimmedName.length === 0) {
                return { success: false, error: 'Project name cannot be empty' }
            }
            if (trimmedName.length > 100) {
                return { success: false, error: 'Project name must be less than 100 characters' }
            }
            data.name = trimmedName
        }

        // Build update data
        const updateData: any = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.color !== undefined) updateData.color = data.color
        if (data.icon !== undefined) updateData.icon = data.icon
        if (data.areaId !== undefined) updateData.areaId = data.areaId

        const project = await prisma.project.update({
            where: {
                id,
                userId: user.id
            },
            data: updateData
        })

            ; (revalidateTag as any)(`projects-${user.id}`)
        revalidatePath('/', 'layout')
        return { success: true, data: project }
    } catch (error: any) {
        console.error('Failed to update project:', error)

        if (error.code === 'P2025') {
            return { success: false, error: 'Project not found or access denied' }
        }
        if (error.code === 'P2003') {
            return { success: false, error: 'Invalid area selected' }
        }

        return { success: false, error: 'Failed to update project' }
    }
}
