import { CreateTaskInline } from '@/components/tasks/create-task-inline'
import { Inbox as InboxIcon, Plus } from 'lucide-react'
import { getCurrentUser } from '@/lib/user-session'
import { InboxTaskList } from '@/components/inbox/inbox-task-list'
import { InboxSkeleton } from '@/components/inbox/inbox-skeleton'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'

export default async function InboxPage() {
    const user = await getCurrentUser()
    if (!user) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch inbox tasks in server component
    // CRITICAL: Inbox contains undated tasks AND past-due tasks
    const inboxTasks = await prisma.task.findMany({
        where: {
            userId: user.id,

            OR: [
                { dueDate: null },           // Undated tasks
                { dueDate: { lt: today } }   // Past-due tasks (before today)
            ]
        },
        select: {
            id: true,
            title: true,
            description: true,
            priority: true,
            dueDate: true,
            completed: true,
            sortOrder: true,
            subtasks: {
                select: {
                    id: true,
                    title: true,
                    completed: true,
                    sortOrder: true,
                },
                orderBy: {
                    sortOrder: 'asc'
                }
            }
        },
        orderBy: [
            { sortOrder: 'asc' },  // User's manual order
            { createdAt: 'desc' }  // Newest first for new tasks
        ],
        take: 100
    })

    return (
        <div className="flex-1 overflow-y-auto min-h-full">
            <div className="max-w-3xl mx-auto px-6 pb-20 pt-8">

                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <div className="flex items-center gap-2">
                        <InboxIcon className="h-6 w-6 text-blue-500 fill-blue-500/10" />
                        <h1 className="text-3xl font-bold text-foreground">Inbox</h1>
                    </div>

                    <div className="h-px w-24 bg-border/50 my-2" />

                    <p className="text-sm text-muted-foreground">
                        Capture everything here
                    </p>
                </div>

                <div className="mt-8 space-y-3">
                    <InboxTaskList tasks={inboxTasks} />

                    <CreateTaskInline

                        className="ml-6"
                        label="Add task to Inbox..."
                    />
                </div>
            </div>
        </div>
    )
}
