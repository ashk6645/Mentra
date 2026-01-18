import { Suspense } from 'react'
import { getTasks } from '@/lib/actions/tasks'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { TaskCard } from '@/components/tasks/task-card'
import { ScrollArea } from '@/components/ui/scroll-area'

async function TaskList() {
    const tasksResult = await getTasks()
    const tasks = tasksResult.success ? tasksResult.data : []

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <p>No tasks found. Add one to get started!</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
            ))}
        </div>
    )
}

export default function TasksPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6 h-full flex flex-col">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
                <div className="flex items-center space-x-2">
                    <CreateTaskDialog />
                </div>
            </div>

            <ScrollArea className="flex-1 -mx-4 px-4">
                <Suspense fallback={<div>Loading tasks...</div>}>
                    <TaskList />
                </Suspense>
            </ScrollArea>
        </div>
    )
}
