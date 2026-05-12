'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Check, Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createSubtask, updateSubtask, deleteSubtask, reorderSubtasks } from '@/lib/actions/subtasks'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

function SortableSubtaskItem({
  subtask,
  isReadOnly,
  onToggle,
  onDelete,
  isEditing,
  editValue,
  onEditChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: {
  subtask: Subtask
  isReadOnly: boolean
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  isEditing: boolean
  editValue: string
  onEditChange: (value: string) => void
  onStartEdit: (id: string, title: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id, disabled: isReadOnly })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { zIndex: 10, position: 'relative' as const } : {}),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 group transition-colors relative",
        isDragging ? 'bg-muted/50 shadow-sm opacity-95' : 'hover:bg-muted/[0.07]'
      )}
    >
      {!isReadOnly && (
        <button
          className="absolute -left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 transition-colors opacity-0 group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        className={cn(
          'h-4 w-4 rounded border-2 flex items-center justify-center transition-all shrink-0',
          subtask.completed
            ? 'bg-primary border-primary scale-100'
            : 'border-muted-foreground/40 hover:border-primary hover:scale-110',
          isReadOnly ? 'cursor-default' : 'cursor-pointer'
        )}
        onClick={() => onToggle(subtask.id, !subtask.completed)}
        disabled={isReadOnly}
      >
        {subtask.completed && (
          <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
        )}
      </button>
      {isEditing && !isReadOnly ? (
        <Input
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSaveEdit()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              onCancelEdit()
            }
          }}
          autoFocus
          className="h-8 py-1.5 flex-1 bg-background border border-border/50 focus-visible:ring-1 focus-visible:ring-primary/50 px-2 text-sm shadow-none"
        />
      ) : (
        <span
          onClick={() => {
            if (!isReadOnly && !subtask.completed) {
              onStartEdit(subtask.id, subtask.title)
            }
          }}
          className={cn(
            'text-sm flex-1 transition-all',
            subtask.completed && 'line-through text-muted-foreground/70',
            !isReadOnly && !subtask.completed && 'cursor-text hover:bg-muted/30 px-1 -mx-1 rounded'
          )}
        >
          {subtask.title}
        </span>
      )}
      {!isReadOnly && !isEditing && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(subtask.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

export function TaskSubtasks({ task, isReadOnly = false }: TaskSubtasksProps) {
  const router = useRouter()
  // Sort initial subtasks by sortOrder
  const initialSubtasks = [...(task.subtasks || [])].sort((a, b) => a.sortOrder - b.sortOrder)
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleStartEdit = (subtaskId: string, title: string) => {
    setEditingSubtaskId(subtaskId)
    setEditValue(title)
  }

  const handleCancelEdit = () => {
    setEditingSubtaskId(null)
    setEditValue('')
  }

  const handleSaveEdit = async () => {
    if (!editingSubtaskId) return

    const subtaskToUpdate = subtasks.find(st => st.id === editingSubtaskId)
    if (!subtaskToUpdate) {
      handleCancelEdit()
      return
    }

    const newTitle = editValue.trim()
    if (!newTitle || newTitle === subtaskToUpdate.title) {
      handleCancelEdit()
      return // No changes or empty string
    }

    const currentId = editingSubtaskId
    const oldTitle = subtaskToUpdate.title

    // Optimistic Update
    setSubtasks((prev) =>
      prev.map((st) => (st.id === currentId ? { ...st, title: newTitle } : st))
    )
    handleCancelEdit()

    // Persist
    const res = await updateSubtask(currentId, { title: newTitle })
    if (res.success) {
      router.refresh()
    } else {
      // Revert on failure
      setSubtasks((prev) =>
        prev.map((st) => (st.id === currentId ? { ...st, title: oldTitle } : st))
      )
    }
  }

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    if (isReadOnly) return

    setSubtasks((prev) =>
      prev.map((st) =>
        st.id === subtaskId ? { ...st, completed } : st
      )
    )

    await updateSubtask(subtaskId, { completed })
    router.refresh()
  }

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim() || isReadOnly) return

    const tempId = `temp-${Date.now()}`
    const optimisticSubtask: Subtask = {
      id: tempId,
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
      router.refresh()
    } else {
      setSubtasks((prev) => prev.filter((st) => st.id !== tempId))
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (isReadOnly) return

    setSubtasks((prev) => prev.filter((st) => st.id !== subtaskId))
    await deleteSubtask(subtaskId)
    router.refresh()
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = subtasks.findIndex((t) => t.id === active.id)
      const newIndex = subtasks.findIndex((t) => t.id === over.id)

      const reorderedSubtasks = arrayMove(subtasks, oldIndex, newIndex)

      // Optimistically update
      setSubtasks(reorderedSubtasks)

      // Persist changes
      const orderedIds = reorderedSubtasks.map((st) => st.id)
      const res = await reorderSubtasks(task.id, orderedIds)

      if (!res.success) {
        // Revert on error
        setSubtasks(subtasks)
      }
    }
  }

  const completedCount = subtasks.filter((st) => st.completed).length
  const totalCount = subtasks.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <section className="space-y-3 border-t border-border/30 pt-7">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/75">
          Subtasks
        </h2>
        <div className="flex items-center gap-2.5">
          <div className="h-0.5 w-16 bg-muted/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground/20 transition-[width] duration-300 ease-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums tracking-tight">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border/40 bg-muted/[0.04] divide-y divide-border/35 overflow-hidden">
        {subtasks.length > 0 && (
          <div className="divide-y relative">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={subtasks.map((st) => st.id)}
                strategy={verticalListSortingStrategy}
              >
                {subtasks.map((subtask) => (
                  <SortableSubtaskItem
                    key={subtask.id}
                    subtask={subtask}
                    isReadOnly={isReadOnly}
                    onToggle={handleToggleSubtask}
                    onDelete={handleDeleteSubtask}
                    isEditing={editingSubtaskId === subtask.id}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
              className="h-9 py-2 flex-1 bg-transparent border-0 focus-visible:ring-0 px-0 text-sm placeholder:text-muted-foreground/60 shadow-none"
            />
          </div>
        )}
      </div>
    </section>
  )
}
