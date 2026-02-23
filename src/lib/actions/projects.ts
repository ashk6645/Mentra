'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/user-session'
import prisma from '@/lib/prisma'

// ============================================
// TYPES
// ============================================

export interface Project {
    id: string
    name: string
    icon: string | null
    color: string
    description: string | null
    isFavorited: boolean
    isArchived: boolean
    sortOrder: number
    taskCount?: number
    createdAt: Date
    updatedAt: Date
}

export interface CreateProjectInput {
    name: string
    icon?: string
    color?: string
    description?: string
}

export interface UpdateProjectInput {
    name?: string
    icon?: string
    color?: string
    description?: string
    isFavorited?: boolean
    isArchived?: boolean
}

// ============================================
// VALIDATION
// ============================================

const VALID_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray']

const EMOJI_REGEX = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u

function validateProjectName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Project name is required' }
    }
    if (name.length > 100) {
        return { valid: false, error: 'Project name must be 100 characters or less' }
    }
    return { valid: true }
}

function validateIcon(icon?: string): { valid: boolean; error?: string } {
    if (!icon) return { valid: true }
    if (!EMOJI_REGEX.test(icon)) {
        return { valid: false, error: 'Icon must be a single emoji' }
    }
    return { valid: true }
}

function validateColor(color?: string): { valid: boolean; error?: string } {
    if (!color) return { valid: true }
    if (!VALID_COLORS.includes(color)) {
        return { valid: false, error: `Color must be one of: ${VALID_COLORS.join(', ')}` }
    }
    return { valid: true }
}

// ============================================
// ACTIONS
// ============================================

/**
 * Get all projects for the current user
 */
export async function getProjects() {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const projects = await prisma.project.findMany({
            where: {
                userId: user.id,
                isArchived: false,
            },
            select: {
                id: true,
                name: true,
                icon: true,
                color: true,
                description: true,
                isFavorited: true,
                isArchived: true,
                sortOrder: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        tasks: {
                            where: {
                                completed: false,
                            },
                        },
                    },
                },
            },
            orderBy: [
                { isFavorited: 'desc' }, // Favorites first
                { sortOrder: 'asc' },    // Then manual order
                { createdAt: 'desc' },   // Then newest
            ],
        })

        const projectsWithCount = projects.map((project) => ({
            ...project,
            taskCount: project._count.tasks,
            _count: undefined,
        }))

        return { success: true, data: projectsWithCount }
    } catch (error) {
        console.error('Error fetching projects:', error)
        return { success: false, error: 'Failed to fetch projects' }
    }
}

/**
 * Get all archived projects for the current user
 */
export async function getArchivedProjects() {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const projects = await prisma.project.findMany({
            where: {
                userId: user.id,
                isArchived: true,
            },
            select: {
                id: true,
                name: true,
                icon: true,
                color: true,
                description: true,
                isFavorited: true,
                isArchived: true,
                sortOrder: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        tasks: {
                            where: { completed: false },
                        },
                    },
                },
            },
            orderBy: [
                { sortOrder: 'asc' },
                { createdAt: 'desc' },
            ],
        })

        const projectsWithCount = projects.map((project) => ({
            ...project,
            taskCount: project._count.tasks,
            _count: undefined,
        }))

        return { success: true, data: projectsWithCount }
    } catch (error) {
        console.error('Error fetching archived projects:', error)
        return { success: false, error: 'Failed to fetch archived projects' }
    }
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const project = await prisma.project.findFirst({
            where: {
                id,
                userId: user.id,
            },
            select: {
                id: true,
                name: true,
                icon: true,
                color: true,
                description: true,
                isFavorited: true,
                isArchived: true,
                sortOrder: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        tasks: {
                            where: {
                                completed: false,
                            },
                        },
                    },
                },
            },
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        return {
            success: true,
            data: {
                ...project,
                taskCount: project._count.tasks,
            },
        }
    } catch (error) {
        console.error('Error fetching project:', error)
        return { success: false, error: 'Failed to fetch project' }
    }
}

/**
 * Create a new project
 */
export async function createProject(input: CreateProjectInput) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Validate input
        const nameValidation = validateProjectName(input.name)
        if (!nameValidation.valid) {
            return { success: false, error: nameValidation.error }
        }

        const iconValidation = validateIcon(input.icon)
        if (!iconValidation.valid) {
            return { success: false, error: iconValidation.error }
        }

        const colorValidation = validateColor(input.color)
        if (!colorValidation.valid) {
            return { success: false, error: colorValidation.error }
        }

        // Get the highest sortOrder to append new project at the end
        const lastProject = await prisma.project.findFirst({
            where: { userId: user.id },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        })

        const newSortOrder = lastProject ? lastProject.sortOrder + 1 : 0

        // Create project
        const project = await prisma.project.create({
            data: {
                userId: user.id,
                name: input.name.trim(),
                icon: input.icon || '📁',
                color: input.color || 'blue',
                description: input.description?.trim() || null,
                sortOrder: newSortOrder,
            },
            select: {
                id: true,
                name: true,
                icon: true,
                color: true,
                description: true,
                isFavorited: true,
                isArchived: true,
                sortOrder: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        // Revalidate paths
        revalidatePath('/')
        revalidatePath('/inbox')
        revalidatePath('/today')

        return { success: true, data: { ...project, taskCount: 0 } }
    } catch (error) {
        console.error('Error creating project:', error)
        return { success: false, error: 'Failed to create project' }
    }
}

/**
 * Update a project
 */
export async function updateProject(id: string, updates: UpdateProjectInput) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify ownership
        const existingProject = await prisma.project.findFirst({
            where: { id, userId: user.id },
        })

        if (!existingProject) {
            return { success: false, error: 'Project not found' }
        }

        // Validate updates
        if (updates.name !== undefined) {
            const nameValidation = validateProjectName(updates.name)
            if (!nameValidation.valid) {
                return { success: false, error: nameValidation.error }
            }
        }

        if (updates.icon !== undefined) {
            const iconValidation = validateIcon(updates.icon)
            if (!iconValidation.valid) {
                return { success: false, error: iconValidation.error }
            }
        }

        if (updates.color !== undefined) {
            const colorValidation = validateColor(updates.color)
            if (!colorValidation.valid) {
                return { success: false, error: colorValidation.error }
            }
        }

        // Update project
        const project = await prisma.project.update({
            where: { id },
            data: {
                ...(updates.name !== undefined && { name: updates.name.trim() }),
                ...(updates.icon !== undefined && { icon: updates.icon }),
                ...(updates.color !== undefined && { color: updates.color }),
                ...(updates.description !== undefined && { description: updates.description?.trim() || null }),
                ...(updates.isFavorited !== undefined && { isFavorited: updates.isFavorited }),
                ...(updates.isArchived !== undefined && { isArchived: updates.isArchived }),
            },
            select: {
                id: true,
                name: true,
                icon: true,
                color: true,
                description: true,
                isFavorited: true,
                isArchived: true,
                sortOrder: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        tasks: {
                            where: {
                                completed: false,
                            },
                        },
                    },
                },
            },
        })

        // Revalidate paths
        revalidatePath('/')
        revalidatePath(`/projects/${id}`)

        return {
            success: true,
            data: {
                ...project,
                taskCount: project._count.tasks,
            },
        }
    } catch (error) {
        console.error('Error updating project:', error)
        return { success: false, error: 'Failed to update project' }
    }
}

/**
 * Delete a project (soft or hard delete)
 */
export async function deleteProject(id: string, mode: 'soft' | 'hard' = 'soft') {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify ownership
        const existingProject = await prisma.project.findFirst({
            where: { id, userId: user.id },
        })

        if (!existingProject) {
            return { success: false, error: 'Project not found' }
        }

        if (mode === 'soft') {
            // Soft delete: just archive
            await prisma.project.update({
                where: { id },
                data: { isArchived: true },
            })
        } else {
            // Hard delete: remove project and unlink tasks
            await prisma.$transaction([
                // Set projectId to null for all tasks in this project
                prisma.task.updateMany({
                    where: { projectId: id },
                    data: { projectId: null, sectionId: null },
                }),
                // Delete the project (sections will cascade delete)
                prisma.project.delete({
                    where: { id },
                }),
            ])
        }

        // Revalidate paths
        revalidatePath('/')
        revalidatePath('/inbox')
        revalidatePath('/today')

        return { success: true }
    } catch (error) {
        console.error('Error deleting project:', error)
        return { success: false, error: 'Failed to delete project' }
    }
}

/**
 * Reorder projects
 */
export async function reorderProjects(projectIds: string[]) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify user owns all projects
        const projects = await prisma.project.findMany({
            where: {
                id: { in: projectIds },
                userId: user.id,
            },
            select: { id: true },
        })

        if (projects.length !== projectIds.length) {
            return { success: false, error: 'Invalid project IDs' }
        }

        // Update sortOrder for each project
        await prisma.$transaction(
            projectIds.map((id, index) =>
                prisma.project.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        )

        // Revalidate paths
        revalidatePath('/')

        return { success: true }
    } catch (error) {
        console.error('Error reordering projects:', error)
        return { success: false, error: 'Failed to reorder projects' }
    }
}
