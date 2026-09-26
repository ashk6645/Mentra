import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/user-session'
import { getProject } from '@/lib/actions/projects'
import { getSections } from '@/lib/actions/sections'
import { getTasksByProject } from '@/lib/actions/tasks'
import { TaskSelectionToggle } from '@/components/tasks/task-selection-toggle'
import { ProjectActions } from '@/components/projects/project-actions'
import { ProjectViewSwitch, type ProjectView } from '@/components/projects/project-view-switch'
import { TaskList } from '@/components/task-list'
import { TaskTable } from '@/components/task-table'

interface ProjectPageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ view?: string }>
}

/**
 * A project: its header, then its tasks as a list or a table.
 *
 * Both views are layouts over the same tasks and sections, and share one set of
 * remembered choices (`storageKey`) — collapse a section or show completed work
 * in one, and the other agrees.
 */
export default async function ProjectPage(props: ProjectPageProps) {
    const [params, search] = await Promise.all([props.params, props.searchParams])
    const view: ProjectView = search.view === 'table' ? 'table' : 'list'

    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const projectResult = await getProject(params.id)
    if (!projectResult.success || !projectResult.data) notFound()
    const project = projectResult.data

    // Independent reads, so they run together rather than one after another.
    const [sectionsResult, tasksResult] = await Promise.all([getSections(params.id), getTasksByProject(params.id)])
    const sections = sectionsResult.success && sectionsResult.data
        ? sectionsResult.data.map(section => ({ id: section.id, name: section.name }))
        : []
    const tasks = tasksResult.success && tasksResult.data ? tasksResult.data : []

    const open = tasks.filter(task => !task.completed).length
    const done = tasks.length - open

    // A table needs room for its columns; a list reads best narrower.
    const width = view === 'table' ? 'max-w-6xl' : 'max-w-3xl'
    const shared = {
        tasks,
        sections,
        projectId: params.id,
        project: { id: project.id, name: project.name, icon: project.icon, color: project.color },
        storageKey: `project:${params.id}`,
        ariaLabel: `${project.name} tasks`,
    }

    return (
        <div className="flex h-full flex-col">
            <header className={`${width} mx-auto w-full px-6 pb-6 pt-12`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-2xl dark:bg-white/[0.06]">
                            {project.icon || '📁'}
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-[26px] font-semibold leading-tight tracking-[-0.025em] text-foreground">
                                {project.name}
                            </h1>
                            <p className="mt-0.5 text-[13px] tabular-nums text-muted-foreground">
                                {open} open{done > 0 && <> · {done} done</>}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        <ProjectViewSwitch view={view} />
                        {view === 'list' && tasks.length > 0 && <TaskSelectionToggle taskIds={tasks.map(task => task.id)} />}
                        <ProjectActions project={project} />
                    </div>
                </div>

                {project.description && (
                    <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{project.description}</p>
                )}
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className={`${width} mx-auto px-6 pb-24 pt-1`}>
                    {view === 'table' ? <TaskTable {...shared} /> : <TaskList {...shared} />}
                </div>
            </div>
        </div>
    )
}
