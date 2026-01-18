import { getTasks } from '@/lib/actions/tasks'
import { FocusModeClient } from '@/components/focus/focus-mode-client'

export default async function FocusPage() {
    const tasksResult = await getTasks()
    const allTasks = tasksResult.success ? tasksResult.data : []

    // Filter incomplete tasks for focus selection
    const incompleteTasks = allTasks.filter((t: any) => !t.completed)

    return <FocusModeClient tasks={incompleteTasks} />
}
