import { getTasks } from '@/lib/actions/tasks'
import { CreateTaskInline } from '@/components/tasks/create-task-inline'
import { MyTasksList } from '@/components/tasks/my-tasks-list'
import { ListTodo, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
    const tasksResult = await getTasks()
    const tasks = tasksResult.success ? tasksResult.data : []

    return (
        <div className="flex-1 overflow-y-auto min-h-full">
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
                    <MyTasksList tasks={tasks} />

                    {/* Add Task Button Row */}
                    <CreateTaskInline className="ml-6" />
                </div>
            </div>
        </div>
    )
}