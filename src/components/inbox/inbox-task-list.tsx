import { TaskRow } from '@/components/tasks/task-row'
import prisma from '@/lib/prisma'

interface InboxTaskListProps {
    userId: string
}

export async function InboxTaskList({ userId }: InboxTaskListProps) {
    // Direct query - faster than action
    const inboxTasks = await prisma.task.findMany({
        where: {
            userId: userId,
            projectId: null
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
        take: 100 // Limit to 100 to prevent massive payloads
    })

    if (inboxTasks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
                Your inbox is empty. Great job!
            </div>
        )
    }

    return (
        <>
            {inboxTasks.map((task: any) => (
                <TaskRow key={task.id} task={task} />
            ))}
        </>
    )
}
