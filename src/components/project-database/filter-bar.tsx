'use client'

import React, { useState } from 'react'
import {
  Filter as FilterIcon,
  Plus,
  X,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProjectDatabase } from './project-database-context'
import {
  Filter,
  FilterOperator,
  ColumnDefinition,
  DEFAULT_COLUMNS,
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from './types'

// ========================================
// FILTER BAR
// ========================================

export function FilterBar() {
  const { viewState, addFilter, removeFilter, setFilters } = useProjectDatabase()
  const [isOpen, setIsOpen] = useState(false)

  const activeFilterCount = viewState.filters.length

  const clearAllFilters = () => {
    setFilters([])
  }

  return (
    <div className="flex items-center gap-2">
      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1">
          {viewState.filters.slice(0, 2).map((filter) => (
            <FilterBadge
              key={filter.id}
              filter={filter}
              onRemove={() => removeFilter(filter.id)}
            />
          ))}
          {activeFilterCount > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{activeFilterCount - 2} more
            </Badge>
          )}
        </div>
      )}

      {/* Filter Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FilterIcon className="h-4 w-4" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1 min-w-[20px] h-5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96 p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Filters</h3>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Active Filters */}
            {viewState.filters.length > 0 && (
              <div className="space-y-2">
                {viewState.filters.map((filter, index) => (
                  <FilterRow
                    key={filter.id}
                    filter={filter}
                    index={index}
                    onRemove={() => removeFilter(filter.id)}
                  />
                ))}
              </div>
            )}

            {/* Add Filter Button */}
            <AddFilterButton onAdd={(filter) => {
              addFilter(filter)
            }} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ========================================
// FILTER BADGE
// ========================================

interface FilterBadgeProps {
  filter: Filter
  onRemove: () => void
}

function FilterBadge({ filter, onRemove }: FilterBadgeProps) {
  const column = DEFAULT_COLUMNS.find((c) => c.id === filter.field)
  
  return (
    <Badge variant="secondary" className="gap-1.5 pr-1 text-xs">
      <span className="font-medium">{column?.name}:</span>
      <span className="text-muted-foreground">{String(filter.value)}</span>
      <button
        onClick={onRemove}
        className="ml-1 rounded-sm opacity-70 hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}

// ========================================
// FILTER ROW
// ========================================

interface FilterRowProps {
  filter: Filter
  index: number
  onRemove: () => void
}

function FilterRow({ filter, index, onRemove }: FilterRowProps) {
  const column = DEFAULT_COLUMNS.find((c) => c.id === filter.field)
  
  return (
    <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
      <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
        <div className="font-medium truncate">{column?.name}</div>
        <div className="text-muted-foreground truncate">{filter.operator}</div>
        <div className="truncate">{String(filter.value)}</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

// ========================================
// ADD FILTER BUTTON
// ========================================

interface AddFilterButtonProps {
  onAdd: (filter: Filter) => void
}

function AddFilterButton({ onAdd }: AddFilterButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [field, setField] = useState('')
  const [operator, setOperator] = useState<FilterOperator>('is')
  const [value, setValue] = useState('')

  const filterableColumns = DEFAULT_COLUMNS.filter((c) => c.filterable)

  const getOperatorsForColumn = (columnId: string): FilterOperator[] => {
    const column = DEFAULT_COLUMNS.find((c) => c.id === columnId)
    if (!column) return ['is', 'is_not']

    switch (column.type) {
      case 'status':
      case 'priority':
      case 'area':
        return ['is', 'is_not', 'is_empty', 'is_not_empty']
      case 'date':
        return ['before', 'after', 'on_or_before', 'on_or_after', 'is_empty', 'is_not_empty']
      case 'title':
      case 'text':
        return ['contains', 'does_not_contain', 'is_empty', 'is_not_empty']
      default:
        return ['is', 'is_not', 'is_empty', 'is_not_empty']
    }
  }

  const handleAdd = () => {
    if (!field) return

    const filter: Filter = {
      id: Math.random().toString(36).substring(7),
      field,
      operator,
      value,
    }

    onAdd(filter)
    setIsAdding(false)
    setField('')
    setOperator('is')
    setValue('')
  }

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsAdding(true)}
        className="w-full gap-2 text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Add filter
      </Button>
    )
  }

  return (
    <div className="space-y-3 p-3 border rounded-md">
      {/* Field */}
      <div className="space-y-1.5">
        <Label className="text-xs">Field</Label>
        <Select value={field} onValueChange={setField}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select field..." />
          </SelectTrigger>
          <SelectContent>
            {filterableColumns.map((column) => (
              <SelectItem key={column.id} value={column.id}>
                {column.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator */}
      {field && (
        <div className="space-y-1.5">
          <Label className="text-xs">Condition</Label>
          <Select
            value={operator}
            onValueChange={(v) => setOperator(v as FilterOperator)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getOperatorsForColumn(field).map((op) => (
                <SelectItem key={op} value={op}>
                  {op.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Value */}
      {field && !['is_empty', 'is_not_empty'].includes(operator) && (
        <div className="space-y-1.5">
          <Label className="text-xs">Value</Label>
          <FilterValueInput
            field={field}
            operator={operator}
            value={value}
            onChange={setValue}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleAdd} className="flex-1 h-7">
          Add
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsAdding(false)
            setField('')
            setOperator('is')
            setValue('')
          }}
          className="flex-1 h-7"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ========================================
// FILTER VALUE INPUT
// ========================================

interface FilterValueInputProps {
  field: string
  operator: FilterOperator
  value: string
  onChange: (value: string) => void
}

function FilterValueInput({ field, operator, value, onChange }: FilterValueInputProps) {
  const column = DEFAULT_COLUMNS.find((c) => c.id === field)

  if (!column) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8"
        placeholder="Enter value..."
      />
    )
  }

  // Status select
  if (column.type === 'status') {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Select status..." />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(PROJECT_STATUSES).map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Priority select
  if (column.type === 'priority') {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Select priority..." />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(PROJECT_PRIORITIES).map((priority) => (
            <SelectItem key={priority} value={priority}>
              {PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Date input
  if (column.type === 'date') {
    return (
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8"
      />
    )
  }

  // Default text input
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8"
      placeholder="Enter value..."
    />
  )
}
