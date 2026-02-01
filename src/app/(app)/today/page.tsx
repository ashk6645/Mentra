import { CreateTaskInline } from '@/components/tasks/create-task-inline'
import { TodayHeader } from '@/components/today/today-header'
import { TodayTaskList } from '@/components/today/today-task-list'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export default async function TodayPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Direct query - much faster
    // CRITICAL: Only show tasks with dueDate === current local date
    const todayTasks = await prisma.task.findMany({
        where: {
            userId: user.id,
            dueDate: {
                gte: today,    // Start of today (inclusive)
                lt: tomorrow   // Before tomorrow (exclusive)
            },
            OR: [
                { completed: false },
                { completedAt: { gte: today } }
            ]
        },
        select: {
            id: true,
            title: true,
            priority: true,
            dueDate: true,
            completed: true,
            completedAt: true,
            sortOrder: true,
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
            }  // Required for drag-and-drop
        },
        orderBy: [
            { sortOrder: 'asc' },  // Primary: User's manual order
            { createdAt: 'desc' }  // Fallback: Newest first for new tasks
        ]
    })

    const highPriorityCount = todayTasks.filter((t: any) =>
        !t.completed && (t.priority === 'high' || t.priority === 'urgent')
    ).length

    return (
        <div className="flex-1 overflow-y-auto min-h-full">
            <div className="max-w-3xl mx-auto px-6 pb-20 pt-8">

                <TodayHeader
                    date={new Date()}
                    totalTasks={todayTasks.length}
                    highPriorityCount={highPriorityCount}
                />

                <div className="mt-8 space-y-3">
                    <TodayTaskList tasks={todayTasks} />

                    <CreateTaskInline />
                </div>
            </div>
        </div>
    )
}
