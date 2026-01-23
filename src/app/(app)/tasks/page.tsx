import { Suspense } from 'react'
import { getTasks } from '@/lib/actions/tasks'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { TaskRow } from '@/components/tasks/task-row'
import { CheckCircle2, ListTodo, Plus } from 'lucide-react'

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
        <div className="space-y-3">
            {tasks.map((task: any) => (
                <TaskRow key={task.id} task={task} />
            ))}
        </div>
    )
}

export default function TasksPage() {
    return (
        <div className="flex-1 overflow-y-auto bg-muted/5 min-h-full">
            <div className="max-w-3xl mx-auto px-6 pb-20 pt-8">

                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <div className="flex items-center gap-2">
                        <ListTodo className="h-6 w-6 text-green-500" />
                        <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
                    </div>

                    <div className="h-px w-24 bg-border/50 my-2" />

                    <p className="text-sm text-muted-foreground">
                        All your tasks in one place
                    </p>
                </div>

                <div className="mt-8 space-y-3">
                    <Suspense fallback={<div className="text-center py-10 text-muted-foreground">Loading tasks...</div>}>
                        <TaskList />
                    </Suspense>

                    {/* Add Task Button Row */}
                    <CreateTaskDialog
                        trigger={
                            <div className="w-full flex items-center gap-3 p-4 rounded-lg border border-dashed border-muted-foreground/30 hover:bg-muted/50 transition-colors cursor-pointer text-muted-foreground hover:text-foreground group">
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                                    <Plus className="h-3 w-3 group-hover:text-primary transition-colors" />
                                </div>
                                <span className="font-medium">Add task...</span>
                            </div>
                        }
                    />
                </div>
            </div>
        </div>
    )
}
