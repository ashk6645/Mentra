'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/user-session'
import prisma from '@/lib/prisma'

// ============================================
// TYPES
// ============================================

export interface Section {
    id: string
    projectId: string
    name: string
    sortOrder: number
    taskCount?: number
    createdAt: Date
    updatedAt: Date
}

// ============================================
// VALIDATION
// ============================================

function validateSectionName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Section name is required' }
    }
    if (name.length > 100) {
        return { valid: false, error: 'Section name must be 100 characters or less' }
    }
    return { valid: true }
}

// ============================================
// ACTIONS
// ============================================

/**
 * Get all sections for a project
 */
export async function getSections(projectId: string) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify user owns the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: user.id,
            },
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        const sections = await prisma.section.findMany({
            where: {
                projectId,
            },
            select: {
                id: true,
                projectId: true,
                name: true,
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
            orderBy: {
                sortOrder: 'asc',
            },
        })

        const sectionsWithCount = sections.map((section) => ({
            ...section,
            taskCount: section._count.tasks,
            _count: undefined,
        }))

        return { success: true, data: sectionsWithCount }
    } catch (error) {
        console.error('Error fetching sections:', error)
        return { success: false, error: 'Failed to fetch sections' }
    }
}

/**
 * Create a new section
 */
export async function createSection(projectId: string, name: string) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify user owns the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: user.id,
            },
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        // Validate name
        const nameValidation = validateSectionName(name)
        if (!nameValidation.valid) {
            return { success: false, error: nameValidation.error }
        }

        // Get the highest sortOrder to append new section at the end
        const lastSection = await prisma.section.findFirst({
            where: { projectId },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        })

        const newSortOrder = lastSection ? lastSection.sortOrder + 1 : 0

        // Create section
        const section = await prisma.section.create({
            data: {
                projectId,
                name: name.trim(),
                sortOrder: newSortOrder,
            },
            select: {
                id: true,
                projectId: true,
                name: true,
                sortOrder: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        // Revalidate paths
        revalidatePath(`/projects/${projectId}`)

        return { success: true, data: { ...section, taskCount: 0 } }
    } catch (error) {
        console.error('Error creating section:', error)
        return { success: false, error: 'Failed to create section' }
    }
}

/**
 * Update a section (rename)
 */
export async function updateSection(id: string, name: string) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify user owns the parent project
        const section = await prisma.section.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        id: true,
                        userId: true,
                    },
                },
            },
        })

        if (!section || section.project.userId !== user.id) {
            return { success: false, error: 'Section not found' }
        }

        // Validate name
        const nameValidation = validateSectionName(name)
        if (!nameValidation.valid) {
            return { success: false, error: nameValidation.error }
        }

        // Update section
        const updatedSection = await prisma.section.update({
            where: { id },
            data: { name: name.trim() },
            select: {
                id: true,
                projectId: true,
                name: true,
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
        revalidatePath(`/projects/${section.project.id}`)

        return {
            success: true,
            data: {
                ...updatedSection,
                taskCount: updatedSection._count.tasks,
            },
        }
    } catch (error) {
        console.error('Error updating section:', error)
        return { success: false, error: 'Failed to update section' }
    }
}

/**
 * Delete a section (moves tasks to "No Section")
 */
export async function deleteSection(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify user owns the parent project
        const section = await prisma.section.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        id: true,
                        userId: true,
                    },
                },
            },
        })

        if (!section || section.project.userId !== user.id) {
            return { success: false, error: 'Section not found' }
        }

        const projectId = section.project.id

        // Delete section and move tasks to "No Section"
        await prisma.$transaction([
            // Set sectionId to null for all tasks in this section
            prisma.task.updateMany({
                where: { sectionId: id },
                data: { sectionId: null },
            }),
            // Delete the section
            prisma.section.delete({
                where: { id },
            }),
        ])

        // Revalidate paths
        revalidatePath(`/projects/${projectId}`)

        return { success: true }
    } catch (error) {
        console.error('Error deleting section:', error)
        return { success: false, error: 'Failed to delete section' }
    }
}

/**
 * Reorder sections within a project
 */
export async function reorderSections(projectId: string, sectionIds: string[]) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify user owns the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: user.id,
            },
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        // Verify all sections belong to this project
        const sections = await prisma.section.findMany({
            where: {
                id: { in: sectionIds },
                projectId,
            },
            select: { id: true },
        })

        if (sections.length !== sectionIds.length) {
            return { success: false, error: 'Invalid section IDs' }
        }

        // Update sortOrder for each section
        await prisma.$transaction(
            sectionIds.map((id, index) =>
                prisma.section.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        )

        // Revalidate paths
        revalidatePath(`/projects/${projectId}`)

        return { success: true }
    } catch (error) {
        console.error('Error reordering sections:', error)
        return { success: false, error: 'Failed to reorder sections' }
    }
}
