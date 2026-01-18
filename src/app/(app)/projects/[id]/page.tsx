import { getProject } from '@/lib/actions/projects'
import { notFound } from 'next/navigation'
import { TaskCard } from '@/components/tasks/task-card'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { ProjectBoard } from '@/components/projects/project-board'
import { ProjectSettingsMenu } from '@/components/projects/project-settings-menu'

interface ProjectPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params
    const project = await getProject(id)

    if (!project) {
        notFound()
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 h-full flex flex-col">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
                <div className="flex items-center space-x-2">
                    {/* <CreateTaskDialog projectId={project.id} />  TODO: Add projectId prop to dialog */}
                    <CreateTaskDialog />
                    <ProjectSettingsMenu project={project} />
                </div>
            </div>

            <p className="text-muted-foreground">{project.description}</p>

            <div className="flex-1 -mx-4 px-4 h-full overflow-hidden">
                <ProjectBoard project={project} />
            </div>
        </div>
    )
}
