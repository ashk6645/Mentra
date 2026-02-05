import { CreateTaskInline } from '@/components/tasks/create-task-inline'
import { TaskSelectionToggle } from '@/components/tasks/task-selection-toggle'
import { PageShell } from '@/components/layout/page-shell'
import { PageHeader } from '@/components/layout/page-header'
import { TodayTaskList } from '@/components/today/today-task-list'
import { Plus, Sun } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { MidnightRefresher } from '@/components/today/midnight-refresher'
import { CurrentDateDisplay } from '@/components/today/current-date-display'

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
        <PageShell>
            <MidnightRefresher />
            <PageHeader
                title="Today"
                description={<CurrentDateDisplay />}
                icon={Sun}
                actions={
                    <div className="flex items-center gap-2">
                        {todayTasks.length > 0 && <TaskSelectionToggle taskIds={todayTasks.map(t => t.id)} />}
                        <div className="text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full">
                            {todayTasks.length} {todayTasks.length === 1 ? 'Task' : 'Tasks'}
                        </div>
                        <div className="text-sm font-medium text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-3 py-1 rounded-full">
                            {highPriorityCount > 0 ? `${highPriorityCount} High Priority` : 'All clear'}
                        </div>
                    </div>
                }
            />

            <div className="space-y-8">
                <TodayTaskList tasks={todayTasks} />
                <CreateTaskInline className="ml-6" />
            </div>
        </PageShell>
    )
}
