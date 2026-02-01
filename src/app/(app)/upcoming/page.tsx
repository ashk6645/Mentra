import { CreateTaskInline } from '@/components/tasks/create-task-inline'
import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { UpcomingHeader } from '@/components/upcoming/upcoming-header'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
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

    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Direct query - fetch tasks from tomorrow to next 7 days
    const upcomingTasks = await prisma.task.findMany({
        where: {
            userId: user.id,
            dueDate: {
                gte: tomorrow,  // Tomorrow onwards
                lt: nextWeek    // Within next 7 days
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
        <div className="flex-1 overflow-y-auto min-h-full">
            <div className="max-w-3xl mx-auto px-6 pb-20 pt-8">

                <UpcomingHeader
                    start={tomorrow}
                    end={nextWeek}
                    totalTasks={upcomingTasks.length}
                />


                <div className="mt-8">
                    {sortedDates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-base font-medium">No upcoming tasks for the next 7 days</p>
                            <p className="text-sm mt-1 opacity-70">Schedule tasks to see them here</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {sortedDates.map((dateKey) => (
                                <div key={dateKey} className="space-y-3">
                                    <h3 className="font-semibold text-sm text-foreground/70 px-1">
                                        {format(new Date(dateKey), 'EEEE, MMMM d')}
                                    </h3>
                                    <SortableTaskList tasks={groupedTasks[dateKey]} />
                                </div>
                            ))}
                        </div>
                    )}

                    <CreateTaskInline
                        className="ml-6 mt-6"
                        label="Add task to upcoming..."
                    />
                </div>
            </div>
        </div>
    )
}
