'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type Project, deleteProject, updateProject } from '@/lib/actions/projects'
import { MoreHorizontal, Edit2, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ProjectRowProps {
    project: Project
    onEdit: (project: Project) => void
    /** 'archived' renders the row in muted style with an unarchive action */
    variant?: 'active' | 'archived'
}

const COLOR_CLASSES: Record<string, string> = {
    red: 'border-red-500',
    orange: 'border-orange-500',
    yellow: 'border-yellow-500',
    green: 'border-green-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    pink: 'border-pink-500',
    gray: 'border-gray-500',
}

export function ProjectRow({ project, onEdit, variant = 'active' }: ProjectRowProps) {
    const pathname = usePathname()
    const router = useRouter()
    const isActive = pathname === `/projects/${project.id}`
    const isArchived = variant === 'archived'
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteProject(project.id, 'hard')
            if (result.success) {
                toast.success('Project deleted')
                setShowDeleteDialog(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Failed to delete project')
            }
        } catch (err) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleArchive = async () => {
        try {
            const result = await deleteProject(project.id, 'soft')
            if (result.success) {
                toast.success('Project archived')
                router.refresh()
            } else {
                toast.error(result.error || 'Failed to archive project')
            }
        } catch (err) {
            toast.error('An unexpected error occurred')
        }
    }

    const handleUnarchive = async () => {
        try {
            const result = await updateProject(project.id, { isArchived: false })
            if (result.success) {
                toast.success('Project unarchived')
                router.refresh()
            } else {
                toast.error(result.error || 'Failed to unarchive project')
            }
        } catch (err) {
            toast.error('An unexpected error occurred')
        }
    }

    return (
        <>
            <div className={`group relative ${isArchived ? 'opacity-60' : ''}`}>
                <Link
                    href={`/projects/${project.id}`}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-sm
                        transition-colors duration-200
                        border-l-2
                        ${isArchived
                            ? `border-transparent hover:bg-accent/30 ${COLOR_CLASSES[project.color] || ''}`
                            : isActive
                                ? `bg-accent font-semibold ${COLOR_CLASSES[project.color] || 'border-blue-500'}`
                                : `border-transparent hover:bg-accent/50 ${COLOR_CLASSES[project.color] || ''}`
                        }
                    `}
                >
                    {/* Icon */}
                    <span className="text-base flex-shrink-0">
                        {project.icon || '📁'}
                    </span>

                    {/* Name */}
                    <span className="flex-1 text-sm truncate">
                        {project.name}
                    </span>

                    {/* Task Count */}
                    {project.taskCount !== undefined && project.taskCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {project.taskCount}
                        </span>
                    )}

                    {/* Actions (shown on hover) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                >
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {!isArchived && (
                                    <DropdownMenuItem onClick={() => onEdit(project)}>
                                        <Edit2 className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {isArchived ? (
                                    <DropdownMenuItem onClick={handleUnarchive}>
                                        <ArchiveRestore className="mr-2 h-4 w-4" />
                                        Unarchive
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={handleArchive}>
                                        <Archive className="mr-2 h-4 w-4" />
                                        Archive
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </Link>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &quot;{project.name}&quot; and remove it from all tasks.
                            Tasks will not be deleted, but will be moved to &quot;No Project&quot;.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
