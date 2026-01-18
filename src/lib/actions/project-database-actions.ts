'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { ProjectStatus, ProjectPriority } from '@prisma/client'

// ========================================
// TYPES
// ========================================

export interface CreateProjectInput {
  name: string
  description?: string | null
  status?: ProjectStatus
  priority?: ProjectPriority
  areaId?: string | null
  startDate?: Date | null
  targetDate?: Date | null
  color?: string | null
  icon?: string | null
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  isArchived?: boolean
}

// ========================================
// GET PROJECTS
// ========================================

export async function getProjects() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', projects: [] }
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
        isArchived: false,
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
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        areaId: true,
        area: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        },
        tasks: {
          select: {
            id: true,
            completed: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Calculate progress for each project
    const projectsWithProgress = projects.map((project) => {
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter((t) => t.completed).length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        ...project,
        progress,
        taskCount: totalTasks,
        completedTaskCount: completedTasks,
      }
    })

    return { success: true, projects: projectsWithProgress }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return { success: false, error: 'Failed to fetch projects', projects: [] }
  }
}

// ========================================
// GET PROJECT BY ID
// ========================================

export async function getProjectById(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', project: null }
    }

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid project ID', project: null }
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
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
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        areaId: true,
        area: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            completed: true,
            priority: true,
            dueDate: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    })

    if (!project) {
      return { success: false, error: 'Project not found', project: null }
    }

    // Calculate progress
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter((t) => t.completed).length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      success: true,
      project: {
        ...project,
        progress,
        taskCount: totalTasks,
        completedTaskCount: completedTasks,
      },
    }
  } catch (error) {
    console.error('Error fetching project:', error)
    return { success: false, error: 'Failed to fetch project', project: null }
  }
}

// ========================================
// CREATE PROJECT
// ========================================

export async function createProject(data: CreateProjectInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', project: null }
    }

    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Project name is required', project: null }
    }

    if (data.name.length > 100) {
      return { success: false, error: 'Project name must be less than 100 characters', project: null }
    }

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: data.name.trim(),
        description: data.description || null,
        status: data.status || 'ACTIVE',
        priority: data.priority || 'MEDIUM',
        areaId: data.areaId || null,
        startDate: data.startDate || null,
        targetDate: data.targetDate || null,
        color: data.color || null,
        icon: data.icon || null,
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
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        areaId: true,
        area: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        },
      },
    })

    revalidatePath('/', 'layout')

    return {
      success: true,
      project: {
        ...project,
        progress: 0,
        taskCount: 0,
        completedTaskCount: 0,
      },
    }
  } catch (error: any) {
    console.error('Error creating project:', error)
    
    if (error.code === 'P2003') {
      return { success: false, error: 'Invalid area selected', project: null }
    }
    
    return { success: false, error: 'Failed to create project', project: null }
  }
}

// ========================================
// UPDATE PROJECT
// ========================================

export async function updateProject(id: string, data: UpdateProjectInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', project: null }
    }

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid project ID', project: null }
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        return { success: false, error: 'Project name cannot be empty', project: null }
      }
      if (data.name.length > 100) {
        return { success: false, error: 'Project name must be less than 100 characters', project: null }
      }
    }

    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: 'Project not found or access denied', project: null }
    }

    // Build update data with proper null handling
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.areaId !== undefined) updateData.areaId = data.areaId
    if (data.startDate !== undefined) updateData.startDate = data.startDate
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate
    if (data.color !== undefined) updateData.color = data.color
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
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
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        areaId: true,
        area: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        },
        tasks: {
          select: {
            id: true,
            completed: true,
          },
        },
      },
    })

    // Calculate progress
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter((t) => t.completed).length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    revalidatePath('/', 'layout')

    return {
      success: true,
      project: {
        ...project,
        progress,
        taskCount: totalTasks,
        completedTaskCount: completedTasks,
      },
    }
  } catch (error: any) {
    console.error('Error updating project:', error)
    
    if (error.code === 'P2003') {
      return { success: false, error: 'Invalid area selected', project: null }
    }
    if (error.code === 'P2025') {
      return { success: false, error: 'Project not found', project: null }
    }
    
    return { success: false, error: 'Failed to update project', project: null }
  }
}

// ========================================
// DELETE PROJECT
// ========================================

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

    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: 'Project not found or access denied' }
    }

    // Delete project (cascade deletes sections and tasks)
    await prisma.project.delete({
      where: { id },
    })

    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting project:', error)
    
    if (error.code === 'P2025') {
      return { success: false, error: 'Project not found' }
    }
    
    return { success: false, error: 'Failed to delete project' }
  }
}

// ========================================
// ARCHIVE PROJECT
// ========================================

export async function archiveProject(id: string) {
  return updateProject(id, { isArchived: true })
}

// ========================================
// UNARCHIVE PROJECT
// ========================================

export async function unarchiveProject(id: string) {
  return updateProject(id, { isArchived: false })
}

// ========================================
// BULK DELETE
// ========================================

export async function bulkDeleteProjects(ids: string[]) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!ids || ids.length === 0) {
      return { success: false, error: 'No project IDs provided' }
    }

    if (ids.some(id => !id || typeof id !== 'string')) {
      return { success: false, error: 'Invalid project IDs' }
    }

    const result = await prisma.project.deleteMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
    })

    revalidatePath('/', 'layout')

    return { success: true, deletedCount: result.count }
  } catch (error) {
    console.error('Error bulk deleting projects:', error)
    return { success: false, error: 'Failed to delete projects' }
  }
}

// ========================================
// BULK UPDATE STATUS
// ========================================

export async function bulkUpdateProjectStatus(ids: string[], status: ProjectStatus) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!ids || ids.length === 0) {
      return { success: false, error: 'No project IDs provided' }
    }

    if (!status || !['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'].includes(status)) {
      return { success: false, error: 'Invalid status' }
    }

    const result = await prisma.project.updateMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
      data: {
        status,
      },
    })

    revalidatePath('/', 'layout')

    return { success: true, updatedCount: result.count }
  } catch (error) {
    console.error('Error bulk updating project status:', error)
    return { success: false, error: 'Failed to update project status' }
  }
}
