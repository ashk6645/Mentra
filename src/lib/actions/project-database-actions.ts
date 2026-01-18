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
      return { error: 'Unauthorized' }
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
        isArchived: false,
      },
      include: {
        area: true,
        tasks: {
          select: {
            id: true,
            completed: true,
          },
        },
        _count: {
          select: {
            tasks: true,
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

    return { projects: projectsWithProgress }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return { error: 'Failed to fetch projects' }
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
      return { error: 'Unauthorized' }
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        area: true,
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
      return { error: 'Project not found' }
    }

    // Calculate progress
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter((t) => t.completed).length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      project: {
        ...project,
        progress,
        taskCount: totalTasks,
        completedTaskCount: completedTasks,
      },
    }
  } catch (error) {
    console.error('Error fetching project:', error)
    return { error: 'Failed to fetch project' }
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
      return { error: 'Unauthorized' }
    }

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description,
        status: data.status || 'ACTIVE',
        priority: data.priority || 'MEDIUM',
        areaId: data.areaId,
        startDate: data.startDate,
        targetDate: data.targetDate,
        color: data.color,
        icon: data.icon,
      },
      include: {
        area: true,
      },
    })

    revalidatePath('/projects')
    revalidatePath('/dashboard')

    return {
      project: {
        ...project,
        progress: 0,
        taskCount: 0,
        completedTaskCount: 0,
      },
    }
  } catch (error) {
    console.error('Error creating project:', error)
    return { error: 'Failed to create project' }
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
      return { error: 'Unauthorized' }
    }

    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return { error: 'Project not found' }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        priority: data.priority,
        areaId: data.areaId,
        startDate: data.startDate,
        targetDate: data.targetDate,
        color: data.color,
        icon: data.icon,
        isArchived: data.isArchived,
      },
      include: {
        area: true,
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

    revalidatePath('/projects')
    revalidatePath('/dashboard')

    return {
      project: {
        ...project,
        progress,
        taskCount: totalTasks,
        completedTaskCount: completedTasks,
      },
    }
  } catch (error) {
    console.error('Error updating project:', error)
    return { error: 'Failed to update project' }
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
      return { error: 'Unauthorized' }
    }

    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return { error: 'Project not found' }
    }

    await prisma.project.delete({
      where: { id },
    })

    revalidatePath('/projects')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error deleting project:', error)
    return { error: 'Failed to delete project' }
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
      return { error: 'Unauthorized' }
    }

    await prisma.project.deleteMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
    })

    revalidatePath('/projects')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error bulk deleting projects:', error)
    return { error: 'Failed to delete projects' }
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
      return { error: 'Unauthorized' }
    }

    await prisma.project.updateMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
      data: {
        status,
      },
    })

    revalidatePath('/projects')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error bulk updating project status:', error)
    return { error: 'Failed to update project status' }
  }
}
