import { getTasks } from '@/lib/actions/tasks'
import { TaskCard } from '@/components/tasks/task-card'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { isAfter, startOfDay, addDays, isSameDay, format } from 'date-fns'

export default async function UpcomingPage() {
    const allTasks = await getTasks()
    const today = startOfDay(new Date())

    // Filter tasks for the next 7 days
    const upcomingTasks = allTasks.filter(task => {
        if (!task.dueDate) return false
        const date = new Date(task.dueDate)
        return isAfter(date, today)
    }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

    // Group by date
    const groupedTasks: Record<string, typeof upcomingTasks> = {}
    upcomingTasks.forEach(task => {
        const dateKey = format(new Date(task.dueDate!), 'yyyy-MM-dd')
        if (!groupedTasks[dateKey]) {
            groupedTasks[dateKey] = []
        }
        groupedTasks[dateKey].push(task)
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 h-full flex flex-col">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Upcoming</h2>
                <div className="flex items-center space-x-2">
                    <CreateTaskDialog />
                </div>
            </div>

            <p className="text-muted-foreground">Plan your week ahead.</p>

            <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="space-y-6">
                    {Object.keys(groupedTasks).length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No upcoming tasks.
                        </div>
                    ) : (
                        Object.keys(groupedTasks).map(dateKey => (
                            <div key={dateKey} className="space-y-2">
                                <h3 className="font-semibold text-sm text-muted-foreground">
                                    {format(new Date(dateKey), 'EEEE, MMMM d')}
                                </h3>
                                {groupedTasks[dateKey].map(task => (
                                    <TaskCard key={task.id} task={task} />
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
