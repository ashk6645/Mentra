'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit2, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { deleteSection, updateSection } from '@/lib/actions/sections'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'

interface SectionHeaderProps {
    section: {
        id: string
        name: string
        projectId: string
    }
    taskCount?: number
}

export function SectionHeader({ section, taskCount = 0 }: SectionHeaderProps) {
    const router = useRouter()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editedName, setEditedName] = useState(section.name)
    const [isUpdating, setIsUpdating] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteSection(section.id)
            if (result.success) {
                toast.success('Section deleted', {
                    description: 'Tasks have been moved to "No Section"',
                })
                router.refresh()
            } else {
                toast.error('Failed to delete section', {
                    description: result.error || 'Please try again',
                })
            }
        } catch (error) {
            toast.error('Failed to delete section', {
                description: 'An unexpected error occurred',
            })
        } finally {
            setIsDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    const handleSave = async () => {
        if (!editedName.trim()) {
            toast.error('Section name cannot be empty')
            return
        }

        if (editedName === section.name) {
            setIsEditing(false)
            return
        }

        setIsUpdating(true)
        try {
            const result = await updateSection(section.id, editedName.trim())
            if (result.success) {
                toast.success('Section updated')
                setIsEditing(false)
                router.refresh()
            } else {
                toast.error('Failed to update section', {
                    description: result.error || 'Please try again',
                })
            }
        } catch (error) {
            toast.error('Failed to update section', {
                description: 'An unexpected error occurred',
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleCancel = () => {
        setEditedName(section.name)
        setIsEditing(false)
    }

    return (
        <>
            <div className="group flex items-center gap-2 py-3 px-1">
                {/* Drag Handle */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Section Name */}
                {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                        <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave()
                                if (e.key === 'Escape') handleCancel()
                            }}
                            className="h-7 text-sm font-semibold"
                            autoFocus
                            disabled={isUpdating}
                        />
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isUpdating}
                            className="h-7"
                        >
                            Save
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            disabled={isUpdating}
                            className="h-7"
                        >
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <>
                        <h3 className="flex-1 text-sm font-semibold text-foreground uppercase tracking-wider">
                            {section.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                            {taskCount}
                        </span>
                    </>
                )}

                {/* Actions */}
                {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Rename
                                </DropdownMenuItem>
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
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete section?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the section "{section.name}". Tasks in this section will be moved to "No Section".
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
