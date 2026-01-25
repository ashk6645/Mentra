import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { TodayHeader } from '@/components/today/today-header'
import { TodayTaskRow } from '@/components/today/today-task-row'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export default async function TodayPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Direct query - much faster
    const todayTasks = await prisma.task.findMany({
        where: {
            userId: user.id,
            dueDate: { lt: tomorrow },
            OR: [
                { completed: false },
                { completedAt: { gte: today } }
            ]
        },
        select: {
            id: true,
            title: true,
            priority: true,
            dueDate: true,
            completed: true,
            completedAt: true,
        },
        orderBy: [
            { completed: 'asc' },
            { priority: 'desc' }
        ]
    })

    const highPriorityCount = todayTasks.filter((t: any) =>
        !t.completed && (t.priority === 'high' || t.priority === 'urgent')
    ).length

    return (
        <div className="flex-1 overflow-y-auto bg-muted/5 min-h-full">
            <div className="max-w-3xl mx-auto px-6 pb-20 pt-8">

                <TodayHeader
                    date={new Date()}
                    totalTasks={todayTasks.length}
                    highPriorityCount={highPriorityCount}
                />

                <div className="mt-8 space-y-3">
                    {todayTasks.length > 0 ? (
                        todayTasks.map((task: any) => (
                            <TodayTaskRow key={task.id} task={task} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
                            No tasks scheduled for today.
                        </div>
                    )}

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
