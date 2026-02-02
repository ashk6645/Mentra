import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/user-session'
import { getProject } from '@/lib/actions/projects'
import { getTasksByProject } from '@/lib/actions/tasks'
import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { CreateTaskInline } from '@/components/tasks/create-task-inline'
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
    params: {
        id: string
    }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
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

    // Fetch tasks for this project
    const tasksResult = await getTasksByProject(params.id)
    const tasks = tasksResult.success ? tasksResult.data : []

    // Separate active and completed tasks
    const activeTasks = tasks.filter(t => !t.completed)
    const completedTasks = tasks.filter(t => t.completed)

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
                                    <span>{activeTasks.length} active</span>
                                    <span>•</span>
                                    <span>{completedTasks.length} completed</span>
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

                    {/* Active Tasks */}
                    {activeTasks.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Active Tasks
                            </h2>
                            <SortableTaskList tasks={activeTasks} />
                        </div>
                    )}

                    {/* Completed Tasks */}
                    {completedTasks.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Completed
                            </h2>
                            <SortableTaskList tasks={completedTasks} />
                        </div>
                    )}

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
