import { getProject } from '@/lib/actions/projects'
import { notFound } from 'next/navigation'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { ProjectTasksContainer } from '@/components/projects/project-tasks-container'
import { ProjectSettingsMenu } from '@/components/projects/project-settings-menu'
import { Badge } from '@/components/ui/badge'

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
        <div className="flex-1 h-full flex flex-col animate-in-fade">
            {/* Header */}
            <div className="px-8 py-6 border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full 
                                ${project.color === 'red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : ''}
                                ${project.color === 'blue' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : ''}
                                ${project.color === 'green' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : ''}
                                ${project.color === 'orange' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : ''}
                                ${project.color === 'purple' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]' : ''}
                                ${(!project.color || project.color === 'neutral') ? 'bg-zinc-400' : ''}
                             `} />
                            <h2 className="text-2xl font-semibold tracking-tight">{project.name}</h2>
                        </div>
                        {project.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                                {project.description}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <CreateTaskDialog projectId={project.id} />
                        <ProjectSettingsMenu project={project} />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-6 overflow-hidden">
                {/* Pass all project tasks (from all sections and uncategorized) to ProjectTasksContainer */}
                <ProjectTasksContainer
                    projectId={project.id}
                    tasks={[
                        ...project.sections.flatMap((section: any) => section.tasks.map((t: any) => ({ ...t, sectionId: section.id }))),
                        ...project.tasks
                    ]}
                />
            </div>
        </div>
    )
}
