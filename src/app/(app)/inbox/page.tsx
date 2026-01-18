import { getTasks } from '@/lib/actions/tasks'
import { TaskCard } from '@/components/tasks/task-card'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export default async function InboxPage() {
    const tasksResult = await getTasks()
    const allTasks = tasksResult.success ? tasksResult.data : []

    // Inbox: Tasks with no project assigned
    const inboxTasks = allTasks.filter((task: any) => !task.projectId)

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 h-full flex flex-col">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
                <div className="flex items-center space-x-2">
                    <CreateTaskDialog />
                </div>
            </div>

            <p className="text-muted-foreground">Capture everything here.</p>

            <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="space-y-2">
                    {inboxTasks.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            Inbox zero!
                        </div>
                    ) : (
                        inboxTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
