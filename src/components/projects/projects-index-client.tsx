'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type Project, updateProject } from '@/lib/actions/projects'
import { Archive, ArchiveRestore, FolderOpen, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const COLOR_ACCENTS: Record<string, string> = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    gray: 'bg-gray-500',
}

const COLOR_BG: Record<string, string> = {
    red: 'bg-red-500/10 dark:bg-red-500/10',
    orange: 'bg-orange-500/10 dark:bg-orange-500/10',
    yellow: 'bg-yellow-500/10 dark:bg-yellow-500/10',
    green: 'bg-green-500/10 dark:bg-green-500/10',
    blue: 'bg-blue-500/10 dark:bg-blue-500/10',
    purple: 'bg-purple-500/10 dark:bg-purple-500/10',
    pink: 'bg-pink-500/10 dark:bg-pink-500/10',
    gray: 'bg-gray-500/10 dark:bg-gray-500/10',
}

type FilterView = 'active' | 'archived'

interface ProjectCardProps {
    project: Project
    variant: 'active' | 'archived'
    onUnarchive?: (id: string) => void
    isUnarchiving?: boolean
}

function ProjectCard({ project, variant, onUnarchive, isUnarchiving }: ProjectCardProps) {
    const isArchived = variant === 'archived'

    const cardContent = (
        <div
            className={cn(
                'relative flex flex-col gap-3 rounded-xl border border-border/50 p-4 transition-all duration-200 h-full overflow-hidden',
                isArchived
                    ? 'opacity-60 bg-muted/30 hover:opacity-80 cursor-default'
                    : 'bg-background hover:shadow-md hover:-translate-y-0.5 hover:border-border cursor-pointer group'
            )}
        >
            {/* Color accent bar */}
            <div
                className={cn(
                    'absolute top-0 left-0 right-0 h-0.5 rounded-t-xl',
                    COLOR_ACCENTS[project.color] || 'bg-blue-500'
                )}
            />

            {/* Icon + Name */}
            <div className="flex items-center gap-3 pt-1">
                <div
                    className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-lg text-xl flex-shrink-0',
                        COLOR_BG[project.color] || 'bg-blue-500/10'
                    )}
                >
                    {project.icon || '📁'}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                        {project.name}
                    </h3>
                    {project.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {project.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Task count + archive badge */}
            <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-muted-foreground">
                    {project.taskCount !== undefined
                        ? project.taskCount === 0
                            ? 'No open tasks'
                            : `${project.taskCount} open task${project.taskCount !== 1 ? 's' : ''}`
                        : ''}
                </span>
                {isArchived && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <Archive className="h-2.5 w-2.5" />
                        Archived
                    </span>
                )}
            </div>

            {/* Unarchive button (archived view only) */}
            {isArchived && onUnarchive && (
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        onUnarchive(project.id)
                    }}
                    disabled={isUnarchiving}
                    className="flex items-center justify-center gap-1.5 w-full text-xs font-medium text-foreground bg-background border border-border/60 hover:bg-accent hover:border-border transition-all duration-150 rounded-lg py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArchiveRestore className="h-3.5 w-3.5" />
                    {isUnarchiving ? 'Restoring…' : 'Unarchive'}
                </button>
            )}
        </div>
    )

    if (isArchived) {
        return cardContent
    }

    return (
        <Link href={`/projects/${project.id}`} className="block h-full">
            {cardContent}
        </Link>
    )
}

interface ProjectsIndexClientProps {
    activeProjects: Project[]
    archivedProjects: Project[]
}

export function ProjectsIndexClient({ activeProjects, archivedProjects }: ProjectsIndexClientProps) {
    const router = useRouter()
    const [view, setView] = useState<FilterView>('active')
    const [unarchivingId, setUnarchivingId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleUnarchive = async (id: string) => {
        setUnarchivingId(id)
        try {
            const result = await updateProject(id, { isArchived: false })
            if (result.success) {
                toast.success('Project restored to active')
                startTransition(() => router.refresh())
            } else {
                toast.error(result.error || 'Failed to unarchive project')
            }
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setUnarchivingId(null)
        }
    }

    const projects = view === 'active' ? activeProjects : archivedProjects
    const isEmpty = projects.length === 0

    return (
        <div className="space-y-6">
            {/* Filter Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
                {(['active', 'archived'] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 capitalize',
                            view === v
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {v === 'archived' && <Archive className="h-3.5 w-3.5" />}
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                        <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-medium min-w-[18px] text-center',
                            view === v
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-muted/50 text-muted-foreground/70'
                        )}>
                            {v === 'active' ? activeProjects.length : archivedProjects.length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Project Grid */}
            {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                        {view === 'archived'
                            ? <Archive className="h-8 w-8 text-muted-foreground/50" />
                            : <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
                        }
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                        {view === 'archived' ? 'No archived projects' : 'No projects yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        {view === 'archived'
                            ? 'Archived projects will appear here. You can restore them at any time.'
                            : 'Create your first project to start organizing your tasks.'
                        }
                    </p>
                    {view === 'active' && (
                        <Link
                            href="/projects"
                            className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                            <Plus className="h-4 w-4" />
                            New project
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            variant={view}
                            onUnarchive={view === 'archived' ? handleUnarchive : undefined}
                            isUnarchiving={unarchivingId === project.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
