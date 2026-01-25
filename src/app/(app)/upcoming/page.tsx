import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
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
        <div className="flex-1 overflow-y-auto bg-muted/5 min-h-full">
            <div className="max-w-3xl mx-auto px-6 pb-20 pt-8">

                <UpcomingHeader
                    start={tomorrow}
                    end={nextWeek}
                    totalTasks={upcomingTasks.length}
                />


                <div className="mt-8 space-y-3">
                    {sortedDates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
                            No upcoming tasks for the next 7 days.
                        </div>
                    ) : (
                        <>
                            {sortedDates.map((dateKey, index) => (
                                <div key={dateKey} className={`space-y-3 ${index > 0 ? 'mt-6' : ''}`}>
                                    <h3 className="font-medium text-sm text-muted-foreground ml-1">
                                        {format(new Date(dateKey), 'EEEE, MMMM d')}
                                    </h3>
                                    <SortableTaskList tasks={groupedTasks[dateKey]} />
                                </div>
                            ))}
                        </>
                    )}

                    {/* Add Task Button Row */}
                    <CreateTaskDialog
                        trigger={
                            <div className="ml-6 flex-1 flex items-center gap-3 p-4 rounded-lg border border-dashed border-muted-foreground/30 hover:bg-muted/50 transition-colors cursor-pointer text-muted-foreground hover:text-foreground group">
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                                    <Plus className="h-3 w-3 group-hover:text-primary transition-colors" />
                                </div>
                                <span className="font-medium">Add task to upcoming...</span>
                            </div>
                        }
                    />
                </div>
            </div>
        </div>
    )
}
