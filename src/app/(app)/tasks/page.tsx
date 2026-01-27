import { getTasks } from '@/lib/actions/tasks'
import { getProjects } from '@/lib/actions/projects'
import { getTags } from '@/lib/actions/tags'
import { TaskPageClient } from '@/components/tasks/task-page-client'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
    const [tasksResult, projects, tags] = await Promise.all([
        getTasks(),
        getProjects(),
        getTags()
    ])

    const tasks = tasksResult.success ? tasksResult.data : []

    return (
        <TaskPageClient
            initialTasks={tasks}
            availableProjects={projects}
            availableTags={tags}
        />
    )
}
