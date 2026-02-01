import { getTasks } from '@/lib/actions/tasks'
import { CreateTaskInline } from '@/components/tasks/create-task-inline'
import { MyTasksList } from '@/components/tasks/my-tasks-list'
import { PageShell } from '@/components/layout/page-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ListTodo } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
    const tasksResult = await getTasks()
    const tasks = tasksResult.success ? tasksResult.data : []

    return (
        <PageShell>
            <PageHeader
                title="My Tasks"
                description="All your tasks in one place"
                icon={ListTodo}
                // actions={
                //     <CreateTaskInline
                //         className="w-auto"
                //         label="Add task..."
                //         variant="ghost"
                //     />
                // }
            />

            <div className="space-y-3">
                <MyTasksList tasks={tasks} />

                {/* Add Task Button Row */}
                <CreateTaskInline className="ml-6 opacity-50 hover:opacity-100 transition-opacity" />
            </div>
        </PageShell>
    )
}