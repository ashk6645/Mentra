import { getTasks } from '@/lib/actions/tasks'
import { TaskCard } from '@/components/tasks/task-card'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { isToday, isPast, isSameDay } from 'date-fns'

export default async function TodayPage() {
    const allTasks = await getTasks()

    const todayTasks = allTasks.filter(task => {
        if (!task.dueDate) return false
        const date = new Date(task.dueDate)
        return isSameDay(date, new Date()) || (isPast(date) && !task.isCompleted)
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 h-full flex flex-col">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Today</h2>
                <div className="flex items-center space-x-2">
                    <CreateTaskDialog />
                </div>
            </div>

            <p className="text-muted-foreground">Focus on what needs to be done today.</p>

            <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="space-y-2">
                    {todayTasks.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No tasks for today. You're all caught up!
                        </div>
                    ) : (
                        todayTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
