import { redirect } from 'next/navigation'
import { getTasks } from '@/lib/actions/tasks'
import { getCurrentUser } from '@/lib/user-session'
import { FocusView } from '@/components/focus/focus-view'

export const metadata = {
    title: 'Focus Mode | Mentra',
    description: 'Distraction-free task execution',
}

export default async function FocusPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    // specific logic: fetch tasks for "Today Focus"
    // We want Overdue + Today's tasks
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    // We can fetch all incomplete tasks and filter/sort
    // Or just use the getTasks with dateRange logic if it supports "Up to today"

    // Using dateRange to find tasks due before or on today
    // Start date 1970 ensures we get overdue tasks
    const { data: tasks } = await getTasks({
        completed: false,
        dateRange: {
            start: new Date(0),
            end: today
        }
    })

    // If no tasks, we might still want to show the view (empty state handled in FocusView)
    // We can also fetch *priority* tasks regardless of date if needed, but for now date-based focus is standard.

    return <FocusView tasks={tasks || []} />
}
