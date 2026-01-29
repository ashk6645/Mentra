'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function scheduleTask(taskId: string, startTime: Date, durationMinutes: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  try {
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

    const task = await prisma.task.update({
      where: { id: taskId, userId: user.id },
      data: {
        scheduledStart: startTime,
        scheduledEnd: endTime,
        durationMinutes: durationMinutes,
      }
    })

    revalidatePath('/calendar')
    return { success: true, task }
  } catch (error) {
    console.error('Failed to schedule task:', error)
    return { error: 'Failed to schedule task' }
  }
}

export async function rescheduleTask(taskId: string, newStart: Date) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { durationMinutes: true }
    })

    const duration = existingTask?.durationMinutes || 30
    const newEnd = new Date(newStart.getTime() + duration * 60000)

    const task = await prisma.task.update({
      where: { id: taskId, userId: user.id },
      data: {
        scheduledStart: newStart,
        scheduledEnd: newEnd,
      }
    })

    revalidatePath('/calendar')
    return { success: true, task }
  } catch (error) {
    console.error('Failed to reschedule task:', error)
    return { error: 'Failed to reschedule task' }
  }
}

export async function getScheduledTasks(startDate: Date, endDate: Date) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        scheduledStart: {
          gte: startDate,
          lte: endDate,
        },
        completed: false,
      },
      include: {

        tags: { include: { tag: true } }
      },
      orderBy: { scheduledStart: 'asc' }
    })

    return tasks
  } catch (error) {
    console.error('Failed to get scheduled tasks:', error)
    return []
  }
}

export async function getUnscheduledTasks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        scheduledStart: null,
        completed: false,
      },
      include: {

        tags: { include: { tag: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 most recent unscheduled tasks
    })

    return tasks
  } catch (error) {
    console.error('Failed to get unscheduled tasks:', error)
    return []
  }
}

export async function unscheduleTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  try {
    await prisma.task.update({
      where: { id: taskId, userId: user.id },
      data: {
        scheduledStart: null,
        scheduledEnd: null,
      }
    })

    revalidatePath('/calendar')
    return { success: true }
  } catch (error) {
    console.error('Failed to unschedule task:', error)
    return { error: 'Failed to unschedule task' }
  }
}
