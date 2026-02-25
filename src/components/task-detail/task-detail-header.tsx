'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { X, MoreHorizontal, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { cn } from '@/lib/utils'
import { updateTask, deleteTask } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'

interface Task {
  id: string
  title: string
  completed: boolean
}

interface TaskDetailHeaderProps {
  task: Task
  onClose: () => void
  isReadOnly?: boolean
}

export function TaskDetailHeader({ task, onClose, isReadOnly = false }: TaskDetailHeaderProps) {
  const [title, setTitle] = useState(task.title)
  const [isEditing, setIsEditing] = useState(false)
  const [isCompleted, setIsCompleted] = useState(task.completed)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleTitleChange = async (newTitle: string) => {
    if (!newTitle.trim() || newTitle === task.title) return

    setTitle(newTitle)

    try {
      const result = await updateTask({
        id: task.id,
        title: newTitle,
      })

      if (result.success) {
        router.refresh()
      } else {
        console.error('Failed to update title:', result.error)
        setTitle(task.title) // Revert on error
      }
    } catch (error) {
      console.error('Failed to update title:', error)
      setTitle(task.title) // Revert on error
    }
  }

  const handleToggleComplete = async () => {
    const newCompleted = !isCompleted
    setIsCompleted(newCompleted)

    try {
      const result = await updateTask({
        id: task.id,
        completed: newCompleted,
      })

      if (result.success) {
        router.refresh()
      } else {
        console.error('Failed to toggle completion:', result.error)
        setIsCompleted(isCompleted) // Revert on error
      }
    } catch (error) {
      console.error('Failed to toggle completion:', error)
      setIsCompleted(isCompleted) // Revert on error
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteTask(task.id)

      if (result.success) {
        onClose() // Close panel first
        router.refresh() // Then refresh to update the list
      } else {
        console.error('Failed to delete task:', result.error)
        alert(result.error || 'Failed to delete task')
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
      alert('Failed to delete task')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleTitleClick = () => {
    if (!isReadOnly) {
      setIsEditing(true)
    }
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/10 px-8 pt-10 pb-6">
        <div className="flex items-start gap-4">
          {/* Large Checkbox */}
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleToggleComplete}
            className="mt-0.5 h-6 w-6 rounded-lg border-2 border-muted-foreground/30 hover:border-muted-foreground/50 data-[state=checked]:bg-success data-[state=checked]:border-success transition-all"
          />

          {/* Title - Stronger hierarchy but refined size */}
          <div className="flex-1 min-w-0">
            {isEditing && !isReadOnly ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setIsEditing(false)
                  if (title !== task.title) {
                    handleTitleChange(title)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur()
                  } else if (e.key === 'Escape') {
                    setTitle(task.title)
                    setIsEditing(false)
                  }
                }}
                autoFocus
                className="w-full text-xl font-semibold leading-tight bg-transparent border-none outline-none focus:ring-0 p-0 text-foreground"
              />
            ) : (
              <h1
                onClick={handleTitleClick}
                className={cn(
                  'text-xl font-semibold leading-tight transition-colors',
                  isCompleted ? 'line-through text-muted-foreground/60' : 'text-foreground',
                  !isReadOnly && 'cursor-text hover:text-foreground/80'
                )}
              >
                {title}
              </h1>
            )}
            {isReadOnly && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Read-only · Uncheck to edit
              </p>
            )}
          </div>

          {/* Actions - Tighter grouping */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Delete Action */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Close - desktop only */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 hidden md:flex text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{task.title}" and all its subtasks.
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
