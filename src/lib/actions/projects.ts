'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

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

export async function getProjects() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // TODO: Add shared projects logic later
    const projects = await prisma.project.findMany({
        where: {
            userId: user.id
        },
        orderBy: {
            sortOrder: 'asc'
        }
    })

    return projects
}

export async function createProject(data: CreateProjectInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const result = createProjectSchema.safeParse(data)

    if (!result.success) {
        return { error: result.error.flatten() }
    }

    try {
        const project = await prisma.project.create({
            data: {
                userId: user.id,
                name: result.data.name,
                description: result.data.description,
                color: result.data.color,
                icon: result.data.icon,
                areaId: result.data.areaId
            },
        })

        // Create sections if provided from template
        if (result.data.sections && result.data.sections.length > 0) {
            const sectionsData = result.data.sections.map((name, index) => ({
                projectId: project.id,
                name,
                sortOrder: index,
            }))
            
            const createdSections = await prisma.section.createMany({
                data: sectionsData,
            })

            // Get the created sections to create starter tasks
            if (result.data.starterTasks && result.data.starterTasks.length > 0) {
                const sections = await prisma.section.findMany({
                    where: { projectId: project.id },
                    orderBy: { sortOrder: 'asc' },
                })

                const tasksData = result.data.starterTasks.map((task, index) => ({
                    userId: user.id,
                    projectId: project.id,
                    sectionId: sections[task.sectionIndex]?.id || sections[0]?.id,
                    title: task.title,
                    sortOrder: index,
                }))

                await prisma.task.createMany({
                    data: tasksData,
                })
            }
        }

        revalidatePath('/projects')
        revalidatePath('/dashboard')
        return { success: true, data: project }
    } catch (error) {
        return { error: 'Failed to create project' }
    }
}

export async function getProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const project = await prisma.project.findUnique({
        where: {
            id,
            userId: user.id
        },
        include: {
            sections: {
                orderBy: {
                    sortOrder: 'asc'
                },
                include: {
                    tasks: {
                        orderBy: { sortOrder: 'asc' },
                        include: {
                            tags: { include: { tag: true } },
                            subTasks: true
                        }
                    }
                }
            },
            tasks: {
                where: {
                    sectionId: null, // Get tasks without section
                    parentTaskId: null
                },
                orderBy: { sortOrder: 'asc' },
                include: {
                    tags: { include: { tag: true } },
                    subTasks: true
                }
            }
        }
    })

    return project
}

export async function deleteProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    try {
        await prisma.project.delete({
            where: {
                id,
                userId: user.id
            }
        })

        revalidatePath('/projects')
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to delete project' }
    }
}

export async function updateProject(id: string, data: Partial<CreateProjectInput>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    try {
        const project = await prisma.project.update({
            where: {
                id,
                userId: user.id
            },
            data: {
                name: data.name,
                description: data.description,
                color: data.color,
                icon: data.icon,
                areaId: data.areaId
            }
        })

        revalidatePath('/projects')
        revalidatePath('/dashboard')
        revalidatePath(`/projects/${id}`)
        return { success: true, data: project }
    } catch (error) {
        return { error: 'Failed to update project' }
    }
}
