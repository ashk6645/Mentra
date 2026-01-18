import { getTasks } from '@/lib/actions/tasks'
import { FocusModeClient } from '@/components/focus/focus-mode-client'

export default async function FocusPage() {
    const tasks = await getTasks()

    // Filter incomplete tasks for focus selection
    const incompleteTasks = tasks.filter(t => !t.isCompleted)

    return <FocusModeClient tasks={incompleteTasks} />
}
