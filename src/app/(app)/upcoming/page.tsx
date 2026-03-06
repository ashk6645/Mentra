import { CreateTaskInline } from '@/components/tasks/create-task-inline'
import { TaskSelectionToggle } from '@/components/tasks/task-selection-toggle'
import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { PageShell } from '@/components/layout/page-shell'
import { PageHeader } from '@/components/layout/page-header'
import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function UpcomingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)



    // Direct query - fetch all tasks from tomorrow onwards
    const upcomingTasks = await prisma.task.findMany({
        where: {
            userId: user.id,
            dueDate: {
                gte: tomorrow,  // Tomorrow onwards
            },
            completed: false
        },
        select: {
            id: true,
            title: true,
            description: true,
            priority: true,
            dueDate: true,
            completed: true,
            sortOrder: true,
            // Recurrence
            isRecurring: true,
            recurrenceInterval: true,
            recurrenceStep: true,
            recurrenceDays: true,
            recurrenceEnd: true,
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
        orderBy: [
            { dueDate: 'asc' },
            { sortOrder: 'asc' }
        ]
    })

    // Group by date
    const groupedTasks: Record<string, typeof upcomingTasks> = {}
    upcomingTasks.forEach(task => {
        const dateKey = format(new Date(task.dueDate!), 'yyyy-MM-dd')
        if (!groupedTasks[dateKey]) {
            groupedTasks[dateKey] = []
        }
        groupedTasks[dateKey].push(task)
    })

    const sortedDates = Object.keys(groupedTasks).sort()

    return (
        <PageShell>
            <PageHeader
                title="Upcoming"
                // description="All upcoming tasks"
                actions={
                    <div className="flex items-center gap-2">
                        {upcomingTasks.length > 0 && <TaskSelectionToggle taskIds={upcomingTasks.map(t => t.id)} />}
                        <div className="text-sm font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                            {upcomingTasks.length} tasks scheduled
                        </div>
                    </div>
                }
            />

            <div className="space-y-8">
                {sortedDates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                        {/* Friendly visual */}
                        <div className="relative mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-muted/60 flex items-center justify-center">
                                <CalendarDays className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                        </div>

                        {/* Encouraging copy */}
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            No upcoming tasks!
                        </h3>
                        <p className="text-muted-foreground text-center max-w-md mb-6">
                            Add something when it matters.
                        </p>

                        {/* Clear action */}
                        {/* <CreateTaskInline variant="compact" label="Schedule a task" /> */}
                    </div>
                ) : (
                    <div className="space-y-12">
                        {sortedDates.map((dateKey) => (
                            <div key={dateKey} className="space-y-4">
                                <div className="flex items-center gap-3 pb-2 border-b border-border/20">
                                    <h3 className="font-semibold text-lg tracking-tight">
                                        {format(new Date(dateKey), 'EEEE')}
                                    </h3>
                                    <span className="text-sm text-muted-foreground">
                                        {format(new Date(dateKey), 'MMMM d')}
                                    </span>
                                </div>
                                <SortableTaskList tasks={groupedTasks[dateKey]} />
                            </div>
                        ))}
                    </div>
                )}

                <CreateTaskInline
                    className="ml-6 mt-4"
                    label="Schedule a task"
                />
            </div>
        </PageShell>
    )
}
