import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/user-session'
import { getProject } from '@/lib/actions/projects'
import { getSections } from '@/lib/actions/sections'
import { getTasksByProject } from '@/lib/actions/tasks'
import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { CreateTaskInline } from '@/components/tasks/create-task-inline'
import { SectionHeader } from '@/components/projects/section-header'
import { AddSectionButton } from '@/components/projects/add-section-button'
import { MoreHorizontal, Edit2, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
            <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            {/* Project Icon */}
                            <div className="text-4xl">
                                {project.icon || '📁'}
                            </div>

                            {/* Project Info */}
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-foreground mb-1">
                                    {project.name}
                                </h1>
                                {project.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {project.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span>{totalActiveTasks} active</span>
                                    <span>•</span>
                                    <span>{totalCompletedTasks} completed</span>
                                    {sections.length > 0 && (
                                        <>
                                            <span>•</span>
                                            <span>{sections.length} {sections.length === 1 ? 'section' : 'sections'}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Edit Project
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    {/* Quick Add Task */}
                    <div className="mb-6">
                        <CreateTaskInline
                            defaultProjectId={params.id}
                            placeholder="Add a task to this project..."
                        />
                    </div>

                    {/* Sections */}
                    {sections.map((section) => {
                        const activeTasks = getActiveTasks(section.id)
                        const completedTasks = getCompletedTasks(section.id)
                        const totalTasks = activeTasks.length + completedTasks.length

                        return (
                            <div key={section.id} className="mb-8">
                                <SectionHeader
                                    section={section}
                                    taskCount={totalTasks}
                                />

                                {/* Section Quick Add */}
                                <div className="mb-3 ml-6">
                                    <CreateTaskInline
                                        defaultProjectId={params.id}
                                        defaultSectionId={section.id}
                                        placeholder={`Add a task to ${section.name}...`}
                                        variant="compact"
                                    />
                                </div>

                                {/* Active Tasks in Section */}
                                {activeTasks.length > 0 && (
                                    <div className="mb-4 ml-6">
                                        <SortableTaskList tasks={activeTasks} />
                                    </div>
                                )}

                                {/* Completed Tasks in Section */}
                                {completedTasks.length > 0 && (
                                    <div className="ml-6">
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                            Completed
                                        </h4>
                                        <SortableTaskList tasks={completedTasks} />
                                    </div>
                                )}
                            </div>
                        )
                    })}

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
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
        </div>
    )
}
