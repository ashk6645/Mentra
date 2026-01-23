import { getTasks } from '@/lib/actions/tasks'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { TaskRow } from '@/components/tasks/task-row'
import { UpcomingHeader } from '@/components/upcoming/upcoming-header'
import { isAfter, startOfDay, addDays, isSameDay, format, isBefore } from 'date-fns'
import { Plus } from 'lucide-react'

export default async function UpcomingPage() {
    const tasksResult = await getTasks()
    const allTasks = tasksResult.success ? tasksResult.data : []
    const today = startOfDay(new Date())
    const nextWeek = addDays(today, 7)

    // Filter tasks for the next 7 days
    const upcomingTasks = allTasks.filter((task: any) => {
        if (!task.dueDate) return false
        const date = new Date(task.dueDate)
        // Include tasks strictly after today (tomorrow onwards)
        // OR include today's tasks if we want (usually "Upcoming" means future)
        // Let's include today as well depending on interpretation, 
        // but typically "Today" view handles today.
        // The original code used isAfter(date, today).
        // Let's stick to future dates or check if "Today" is meant to be separate.
        // Usually "Upcoming" includes Today + next 7 days or just Next 7 days.
        // Assuming "Upcoming" = Future 7 days.
        return isAfter(date, today) && isBefore(date, nextWeek)
    }).sort((a: any, b: any) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

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
                    start={addDays(today, 1)}
                    end={nextWeek}
                    totalTasks={upcomingTasks.length}
                />

                <div className="mt-8 space-y-8">
                    {sortedDates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
                            No upcoming tasks for the next 7 days.
                        </div>
                    ) : (
                        sortedDates.map(dateKey => (
                            <div key={dateKey} className="space-y-3">
                                <h3 className="font-medium text-sm text-muted-foreground ml-1">
                                    {format(new Date(dateKey), 'EEEE, MMMM d')}
                                </h3>
                                <div className="space-y-3">
                                    {groupedTasks[dateKey].map((task: any) => (
                                        <TaskRow key={task.id} task={task} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}

                    {/* Add Task Button Row */}
                    <CreateTaskDialog
                        trigger={
                            <div className="w-full flex items-center gap-3 p-4 rounded-lg border border-dashed border-muted-foreground/30 hover:bg-muted/50 transition-colors cursor-pointer text-muted-foreground hover:text-foreground group">
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
