'use client'

import React, { useRef, useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ProjectDatabaseItem,
  ColumnDefinition,
  ProjectStatus,
  ProjectPriority,
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from './types'

// ========================================
// INLINE EDIT CELL
// ========================================

interface InlineEditCellProps {
  project: ProjectDatabaseItem
  column: ColumnDefinition
  areas: { id: string; name: string; color: string | null }[]
  onSave: (value: unknown) => void
  onCancel: () => void
}

export function InlineEditCell({ project, column, areas, onSave, onCancel }: InlineEditCellProps) {
  const value = project[column.id as keyof ProjectDatabaseItem]
  
  switch (column.type) {
    case 'title':
    case 'text':
      return (
        <TextEditCell
          value={String(value || '')}
          onSave={onSave}
          onCancel={onCancel}
          placeholder={column.type === 'title' ? 'Project name...' : `Enter ${column.name.toLowerCase()}...`}
        />
      )
    
    case 'status':
      return (
        <StatusEditCell
          value={value as ProjectStatus}
          onSave={onSave}
          onCancel={onCancel}
        />
      )
    
    case 'priority':
      return (
        <PriorityEditCell
          value={value as ProjectPriority}
          onSave={onSave}
          onCancel={onCancel}
        />
      )
    
    case 'area':
      return (
        <AreaEditCell
          value={project.areaId}
          areas={areas}
          onSave={onSave}
          onCancel={onCancel}
        />
      )
    
    case 'date':
      return (
        <DateEditCell
          value={value as Date | null}
          onSave={onSave}
          onCancel={onCancel}
        />
      )
    
    default:
      return (
        <TextEditCell
          value={String(value || '')}
          onSave={onSave}
          onCancel={onCancel}
        />
      )
  }
}

// ========================================
// TEXT EDIT CELL
// ========================================

interface TextEditCellProps {
  value: string
  onSave: (value: string) => void
  onCancel: () => void
  placeholder?: string
}

function TextEditCell({ value, onSave, onCancel, placeholder }: TextEditCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(value)
  
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSave(inputValue)
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }
  
  const handleBlur = () => {
    if (inputValue !== value) {
      onSave(inputValue)
    } else {
      onCancel()
    }
  }
  
  return (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="h-8 text-sm"
    />
  )
}

// ========================================
// STATUS EDIT CELL
// ========================================

interface StatusEditCellProps {
  value: ProjectStatus
  onSave: (value: ProjectStatus) => void
  onCancel: () => void
}

function StatusEditCell({ value, onSave, onCancel }: StatusEditCellProps) {
  const [open, setOpen] = useState(true)
  
  const handleChange = (newValue: string) => {
    onSave(newValue as ProjectStatus)
    setOpen(false)
  }
  
  return (
    <Select value={value} onValueChange={handleChange} open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) onCancel()
    }}>
      <SelectTrigger className="h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PROJECT_STATUSES).map(([key, status]) => {
          const config = STATUS_CONFIG[status as ProjectStatus]
          return (
            <SelectItem key={key} value={status}>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  status === 'PLANNING' && "bg-purple-500",
                  status === 'ACTIVE' && "bg-blue-500",
                  status === 'ON_HOLD' && "bg-amber-500",
                  status === 'COMPLETED' && "bg-emerald-500"
                )} />
                {config.label}
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

// ========================================
// PRIORITY EDIT CELL
// ========================================

interface PriorityEditCellProps {
  value: ProjectPriority
  onSave: (value: ProjectPriority) => void
  onCancel: () => void
}

function PriorityEditCell({ value, onSave, onCancel }: PriorityEditCellProps) {
  const [open, setOpen] = useState(true)
  
  const handleChange = (newValue: string) => {
    onSave(newValue as ProjectPriority)
    setOpen(false)
  }
  
  return (
    <Select value={value} onValueChange={handleChange} open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) onCancel()
    }}>
      <SelectTrigger className="h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PROJECT_PRIORITIES).map(([key, priority]) => {
          const config = PRIORITY_CONFIG[priority as ProjectPriority]
          return (
            <SelectItem key={key} value={priority}>
              <div className="flex items-center gap-2">
                <span className="text-xs">{config.icon}</span>
                {config.label}
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

// ========================================
// AREA EDIT CELL
// ========================================

interface AreaEditCellProps {
  value: string | null
  areas: { id: string; name: string; color: string | null }[]
  onSave: (value: string | null) => void
  onCancel: () => void
}

function AreaEditCell({ value, areas, onSave, onCancel }: AreaEditCellProps) {
  const [open, setOpen] = useState(true)
  
  const handleChange = (newValue: string) => {
    onSave(newValue === 'none' ? null : newValue)
    setOpen(false)
  }
  
  return (
    <Select value={value || 'none'} onValueChange={handleChange} open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) onCancel()
    }}>
      <SelectTrigger className="h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No area</span>
        </SelectItem>
        {areas.map((area) => (
          <SelectItem key={area.id} value={area.id}>
            <div className="flex items-center gap-2">
              {area.color && (
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: area.color }}
                />
              )}
              {area.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ========================================
// DATE EDIT CELL
// ========================================

interface DateEditCellProps {
  value: Date | null
  onSave: (value: Date | null) => void
  onCancel: () => void
}

function DateEditCell({ value, onSave, onCancel }: DateEditCellProps) {
  const [open, setOpen] = useState(true)
  const [date, setDate] = useState<Date | undefined>(value || undefined)
  
  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      onSave(selectedDate)
      setOpen(false)
    }
  }
  
  const handleClear = () => {
    onSave(null)
    setOpen(false)
  }
  
  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) onCancel()
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={handleClear}
          >
            Clear date
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
