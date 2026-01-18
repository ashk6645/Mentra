'use client'

import React from 'react'
import {
  Settings2,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProjectDatabase } from './project-database-context'
import { ColumnDefinition, DEFAULT_COLUMNS } from './types'

// ========================================
// PROPERTIES PANEL
// ========================================

interface PropertiesPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PropertiesPanel({ open, onOpenChange }: PropertiesPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Properties</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle>View Properties</SheetTitle>
          <SheetDescription>
            Customize which columns are visible and their order
          </SheetDescription>
        </SheetHeader>
        <PropertiesPanelContent />
      </SheetContent>
    </Sheet>
  )
}

// ========================================
// PROPERTIES PANEL CONTENT
// ========================================

function PropertiesPanelContent() {
  const { viewState, toggleColumn, reorderColumns } = useProjectDatabase()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get columns in current order
  const orderedColumns = viewState.columnOrder
    .map((id) => DEFAULT_COLUMNS.find((c) => c.id === id))
    .filter((c): c is ColumnDefinition => c !== undefined)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = orderedColumns.findIndex((c) => c.id === active.id)
      const newIndex = orderedColumns.findIndex((c) => c.id === over.id)

      const newOrder = arrayMove(orderedColumns, oldIndex, newIndex).map((c) => c.id)
      reorderColumns(newOrder)
    }
  }

  const visibleCount = viewState.visibleColumns.length
  const totalCount = orderedColumns.length

  return (
    <div className="mt-6 space-y-6">
      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {visibleCount} of {totalCount} columns visible
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Toggle all
            if (visibleCount === totalCount) {
              // Hide all except name
              orderedColumns.forEach((col) => {
                if (col.id !== 'name' && viewState.visibleColumns.includes(col.id)) {
                  toggleColumn(col.id)
                }
              })
            } else {
              // Show all
              orderedColumns.forEach((col) => {
                if (!viewState.visibleColumns.includes(col.id)) {
                  toggleColumn(col.id)
                }
              })
            }
          }}
          className="h-7 text-xs"
        >
          {visibleCount === totalCount ? 'Hide all' : 'Show all'}
        </Button>
      </div>

      {/* Column List */}
      <ScrollArea className="h-[calc(100vh-240px)]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedColumns.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {orderedColumns.map((column) => (
                <SortableColumnItem
                  key={column.id}
                  column={column}
                  isVisible={viewState.visibleColumns.includes(column.id)}
                  onToggle={() => toggleColumn(column.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>

      {/* Info */}
      <div className="pt-4 border-t text-xs text-muted-foreground">
        <p>💡 Drag columns to reorder them in the table view</p>
      </div>
    </div>
  )
}

// ========================================
// SORTABLE COLUMN ITEM
// ========================================

interface SortableColumnItemProps {
  column: ColumnDefinition
  isVisible: boolean
  onToggle: () => void
}

function SortableColumnItem({ column, isVisible, onToggle }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors',
        isDragging && 'opacity-50 cursor-grabbing',
        !isDragging && 'hover:bg-accent'
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Checkbox */}
      <Checkbox
        id={`column-${column.id}`}
        checked={isVisible}
        onCheckedChange={onToggle}
        disabled={column.id === 'name'} // Name column always visible
      />

      {/* Label */}
      <Label
        htmlFor={`column-${column.id}`}
        className={cn(
          'flex-1 text-sm font-medium cursor-pointer',
          !isVisible && 'text-muted-foreground',
          column.id === 'name' && 'cursor-not-allowed'
        )}
      >
        {column.name}
      </Label>

      {/* Type Badge */}
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
        {column.type}
      </span>

      {/* Visibility Icon */}
      {isVisible ? (
        <Eye className="h-4 w-4 text-muted-foreground" />
      ) : (
        <EyeOff className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  )
}
