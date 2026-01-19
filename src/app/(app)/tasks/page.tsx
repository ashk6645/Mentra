import { Suspense } from 'react'
import { getTasks } from '@/lib/actions/tasks'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { TaskCard } from '@/components/tasks/task-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2 } from 'lucide-react'

async function TaskList() {
    const tasksResult = await getTasks()
    const tasks = tasksResult.success ? tasksResult.data : []

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="bg-muted/50 p-4 rounded-full">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                    <p className="font-medium text-foreground">No tasks yet</p>
                    <p className="text-sm text-muted-foreground">Add a task to get started on your journey.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3 max-w-3xl mx-auto">
            {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
            ))}
        </div>
    )
}

export default function TasksPage() {
    return (
        <div className="flex-1 h-full flex flex-col animate-in-fade">
            <div className="px-8 py-6 border-b border-border/40 flex items-center justify-between bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">My Tasks</h2>
                    <p className="text-sm text-muted-foreground">Manage and track your work.</p>
                </div>
                <CreateTaskDialog />
            </div>

            <ScrollArea className="flex-1 px-8">
                <div className="py-6">
                    <Suspense fallback={<div className="text-center py-10 text-muted-foreground">Loading tasks...</div>}>
                        <TaskList />
                    </Suspense>
                </div>
            </ScrollArea>
        </div>
    )
}
