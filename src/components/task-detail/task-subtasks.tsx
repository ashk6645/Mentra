'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createSubtask, updateSubtask, deleteSubtask } from '@/lib/actions/subtasks'

interface Subtask {
  id: string
  title: string
  completed: boolean
  sortOrder: number
}

interface Task {
  id: string
  subtasks?: Subtask[]
}

interface TaskSubtasksProps {
  task: Task
  isReadOnly?: boolean
}

export function TaskSubtasks({ task, isReadOnly = false }: TaskSubtasksProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || [])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    if (isReadOnly) return

    setSubtasks((prev) =>
      prev.map((st) =>
        st.id === subtaskId ? { ...st, completed } : st
      )
    )

    await updateSubtask(subtaskId, { completed })
  }

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim() || isReadOnly) return

    const tempId = `temp-${Date.now()}`
    const optimisticSubtask: any = {
      id: tempId,
      taskId: task.id,
      title: newSubtaskTitle,
      completed: false,
      sortOrder: subtasks.length,
    }

    setSubtasks((prev) => [...prev, optimisticSubtask])
    setNewSubtaskTitle('')

    const res = await createSubtask(task.id, newSubtaskTitle)
    if (res.success && res.data) {
      setSubtasks((prev) =>
        prev.map((st) => (st.id === tempId ? res.data : st))
      )
    } else {
      setSubtasks((prev) => prev.filter((st) => st.id !== tempId))
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (isReadOnly) return

    setSubtasks((prev) => prev.filter((st) => st.id !== subtaskId))
    await deleteSubtask(subtaskId)
  }

  const completedCount = subtasks.filter((st) => st.completed).length
  const totalCount = subtasks.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">
          Subtasks
        </label>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      <div className="border rounded-lg bg-muted/30 divide-y">
        {subtasks.length > 0 && (
          <div className="divide-y">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-3 px-3 py-2.5 group hover:bg-muted/50 transition-colors"
              >
                <button
                  type="button"
                  className={cn(
                    'h-4 w-4 rounded border-2 flex items-center justify-center transition-all shrink-0',
                    subtask.completed
                      ? 'bg-primary border-primary scale-100'
                      : 'border-muted-foreground/40 hover:border-primary hover:scale-110',
                    isReadOnly ? 'cursor-default' : 'cursor-pointer'
                  )}
                  onClick={() => handleToggleSubtask(subtask.id, !subtask.completed)}
                  disabled={isReadOnly}
                >
                  {subtask.completed && (
                    <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                  )}
                </button>
                <span
                  className={cn(
                    'text-sm flex-1 transition-all',
                    subtask.completed && 'line-through text-muted-foreground/70'
                  )}
                >
                  {subtask.title}
                </span>
                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {!isReadOnly && (
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="h-4 w-4 flex items-center justify-center shrink-0">
              <Plus className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <Input
              placeholder="Add a subtask..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddSubtask(e)
                }
              }}
              className="h-7 flex-1 bg-transparent border-0 focus-visible:ring-0 px-0 text-sm placeholder:text-muted-foreground/60 shadow-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}
