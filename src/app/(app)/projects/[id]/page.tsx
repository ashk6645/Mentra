import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/user-session'
import { getProject } from '@/lib/actions/projects'
import { getSections } from '@/lib/actions/sections'
import { getTasksByProject } from '@/lib/actions/tasks'
import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { CreateTaskInline } from '@/components/tasks/create-task-inline'
import { TaskSelectionToggle } from '@/components/tasks/task-selection-toggle'
import { SectionHeader } from '@/components/projects/section-header'
import { AddSectionButton } from '@/components/projects/add-section-button'
import { SectionList } from '@/components/projects/section-list'
import { ProjectActions } from '@/components/projects/project-actions'


interface ProjectPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ProjectPage(props: ProjectPageProps) {
    const params = await props.params
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch project details
    const projectResult = await getProject(params.id)

    if (!projectResult.success || !projectResult.data) {
        notFound()
    }

    const project = projectResult.data

    // Fetch sections for this project
    const sectionsResult = await getSections(params.id)
    const sections = (sectionsResult.success && sectionsResult.data) ? sectionsResult.data : []

    // Fetch tasks for this project
    const tasksResult = await getTasksByProject(params.id)
    const tasks = (tasksResult.success && tasksResult.data) ? tasksResult.data : []

    // Group tasks by section
    const tasksBySection = tasks.reduce((acc, task) => {
        const sectionId = task.sectionId || 'no-section'
        if (!acc[sectionId]) {
            acc[sectionId] = []
        }
        acc[sectionId].push(task)
        return acc
    }, {} as Record<string, typeof tasks>)

    // Separate active and completed tasks for each section
    const getActiveTasks = (sectionId: string) =>
        (tasksBySection[sectionId] || []).filter(t => !t.completed)

    const getCompletedTasks = (sectionId: string) =>
        (tasksBySection[sectionId] || []).filter(t => t.completed)

    const totalActiveTasks = tasks.filter(t => !t.completed).length
    const totalCompletedTasks = tasks.filter(t => t.completed).length

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="w-full">
                <div className="max-w-4xl mx-auto px-6 pt-12 pb-6">
                    <div className="flex items-start justify-between">
                        {/* Left Column: Title & Description */}
                        <div className="flex flex-col gap-4">
                            {/* Title Area */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 shadow-sm">
                                    <span className="text-3xl">{project.icon || '📁'}</span>
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    {project.name}
                                </h1>
                            </div>

                            {/* Description */}
                            {project.description && (
                                <p className="text-base text-muted-foreground/80 leading-relaxed max-w-2xl">
                                    {project.description}
                                </p>
                            )}
                        </div>

                        {/* Right Column: Actions & Stats */}
                        <div className="flex flex-col items-end gap-4 self-start mt-1">
                            <div className="flex items-center gap-1">
                                {tasks.length > 0 && <TaskSelectionToggle taskIds={tasks.map(t => t.id)} />}
                                {/* Actions Menu */}
                                <ProjectActions project={project} />
                            </div>

                            {/* Stats - Table Style */}
                            <div className="flex items-center border border-border/40 rounded-lg bg-background/50 text-sm shadow-sm">
                                <div className="px-4 py-1.5 border-r border-border/40 text-muted-foreground">
                                    Active: <span className="font-medium text-foreground">{totalActiveTasks}</span>
                                </div>
                                <div className="px-4 py-1.5 text-muted-foreground">
                                    Completed: <span className="font-medium text-foreground">{totalCompletedTasks}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-6 py-2">
                    {/* Quick Add Task */}
                    <div className="mb-6">
                        <CreateTaskInline
                            defaultProjectId={params.id}
                            placeholder="Add a task to this project..."
                        />
                    </div>

                    {/* Sections List */}
                    <div className="mb-8">
                        <SectionList
                            initialSections={sections}
                            tasksBySection={tasksBySection}
                            projectId={params.id}
                        />
                    </div>

                    {/* No Section Tasks */}
                    {tasksBySection['no-section'] && tasksBySection['no-section'].length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 py-3 px-1">
                                No Section
                                <span className="ml-2 text-xs">
                                    {tasksBySection['no-section'].length}
                                </span>
                            </h3>

                            {/* Active Tasks */}
                            {getActiveTasks('no-section').length > 0 && (
                                <div className="mb-4">
                                    <SortableTaskList tasks={getActiveTasks('no-section')} />
                                </div>
                            )}

                            {/* Completed Tasks */}
                            {getCompletedTasks('no-section').length > 0 && (
                                <div>
                                    <div className="border-t border-border/20 my-6" />
                                    <h4 className="text-sm font-medium text-muted-foreground/70 mb-3">
                                        Completed
                                    </h4>
                                    <SortableTaskList tasks={getCompletedTasks('no-section')} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add Section Button */}
                    <div className="mb-6">
                        <AddSectionButton projectId={params.id} />
                    </div>

                    {/* Empty State */}
                    {tasks.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">{project.icon || '📁'}</div>
                            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Add your first task to get started with this project
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    )
}
