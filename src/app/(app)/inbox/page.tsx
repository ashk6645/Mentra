import { CreateTaskInline } from '@/components/tasks/create-task-inline'
import { TaskSelectionToggle } from '@/components/tasks/task-selection-toggle'
import { Inbox as InboxIcon } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { PageHeader } from '@/components/layout/page-header'
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
            completed: false,

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
            // Recurrence
            isRecurring: true,
            recurrenceInterval: true,
            recurrenceStep: true,
            recurrenceDays: true,
            recurrenceEnd: true,
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
            },
            tags: {
                select: {
                    tag: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                        }
                    }
                }
            }
        },
        orderBy: [
            { sortOrder: 'asc' },  // User's manual order
            { createdAt: 'desc' }  // Newest first for new tasks
        ],
        take: 100
    })

    // Calculate overdue count from the fetched tasks
    const overdueCount = inboxTasks.filter(t =>
        t.dueDate && new Date(t.dueDate) < new Date()
    ).length

    return (
        <PageShell>
            <PageHeader
                title="Inbox"
                description={
                    overdueCount > 0
                        ? `${inboxTasks.length} tasks • ${overdueCount} overdue`
                        : "Capture everything here"
                }
                actions={inboxTasks.length > 0 ? <TaskSelectionToggle taskIds={inboxTasks.map(t => t.id)} /> : null}
            />

            <div className="space-y-3">
                <InboxTaskList tasks={inboxTasks} />
                <CreateTaskInline
                    className="ml-6 opacity-50 hover:opacity-100 transition-opacity"
                    label="Add task to Inbox..."
                />
            </div>
        </PageShell>
    )
}
