import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { Inbox as InboxIcon, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InboxTaskList } from '@/components/inbox/inbox-task-list'
import { InboxSkeleton } from '@/components/inbox/inbox-skeleton'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'

export default async function InboxPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch inbox tasks in server component
    const inboxTasks = await prisma.task.findMany({
        where: {
            userId: user.id,
            projectId: null,
            dueDate: null  // Only show tasks without due dates
        },
        select: {
            id: true,
            title: true,
            description: true,
            priority: true,
            dueDate: true,
            completed: true,
            sortOrder: true,
        },
        orderBy: [
            { completed: 'asc' },
            { sortOrder: 'asc' }
        ],
        take: 100
    })

    return (
        <div className="flex-1 overflow-y-auto bg-muted/5 min-h-full">
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

                    <CreateTaskDialog
                        projectId="none"
                        trigger={
                            <div className="ml-6 flex-1 flex items-center gap-3 p-4 rounded-lg border border-dashed border-muted-foreground/30 hover:bg-muted/50 transition-colors cursor-pointer text-muted-foreground hover:text-foreground group">
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                                    <Plus className="h-3 w-3 group-hover:text-primary transition-colors" />
                                </div>
                                <span className="font-medium">Add task to Inbox...</span>
                            </div>
                        }
                    />
                </div>
            </div>
        </div>
    )
}
