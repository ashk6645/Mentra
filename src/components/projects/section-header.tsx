'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit2, Trash2, GripVertical, ChevronRight, ChevronDown } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
    section: {
        id: string
        name: string
        projectId: string
    }
    taskCount?: number
    isExpanded?: boolean
    onToggle?: () => void
    dragHandleProps?: any
}

export function SectionHeader({
    section,
    taskCount = 0,
    isExpanded = true,
    onToggle,
    dragHandleProps
}: SectionHeaderProps) {
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
            <div className="group flex items-center gap-1 py-3 px-1 mb-2 transition-colors">
                {/* Drag Handle */}
                <div
                    {...dragHandleProps}
                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground/40 hover:text-muted-foreground mr-1"
                >
                    <GripVertical className="h-4 w-4" />
                </div>

                {/* Toggle Button */}
                <button
                    onClick={onToggle}
                    className="p-0.5 rounded-sm text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors mr-1"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>

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
                            className="h-7 text-sm font-semibold bg-background"
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
                        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground/80 group-hover:text-foreground transition-colors uppercase tracking-wider">
                            {section.name}
                        </h3>
                        <span className="text-[11px] font-medium text-muted-foreground/50 px-2 py-0.5 rounded-full bg-muted/30">
                            {taskCount}
                        </span>
                        <div className="flex-1" /> {/* Spacer */}
                    </>
                )}

                {/* Actions */}
                {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
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
