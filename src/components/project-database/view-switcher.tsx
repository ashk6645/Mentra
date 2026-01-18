'use client'

import React from 'react'
import { 
  Table, 
  LayoutGrid, 
  Calendar, 
  CalendarRange,
  Check 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProjectDatabase } from './project-database-context'
import { DatabaseView, DATABASE_VIEWS } from './types'

// ========================================
// VIEW SWITCHER
// ========================================

export function ViewSwitcher() {
  const { viewState, setView } = useProjectDatabase()

  const views: Array<{
    value: DatabaseView
    label: string
    icon: React.ReactNode
    description: string
  }> = [
    {
      value: 'table',
      label: 'Table',
      icon: <Table className="h-4 w-4" />,
      description: 'Spreadsheet view with all properties',
    },
    {
      value: 'board',
      label: 'Board',
      icon: <LayoutGrid className="h-4 w-4" />,
      description: 'Kanban board grouped by status',
    },
    {
      value: 'timeline',
      label: 'Timeline',
      icon: <CalendarRange className="h-4 w-4" />,
      description: 'Gantt-style timeline view',
    },
    {
      value: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Monthly calendar with deadlines',
    },
  ]

  return (
    <Tabs 
      value={viewState.view} 
      onValueChange={(value) => setView(value as DatabaseView)}
      className="w-auto"
    >
      <TabsList className="h-9">
        {views.map((view) => (
          <TabsTrigger
            key={view.value}
            value={view.value}
            className="gap-2 px-3"
          >
            {view.icon}
            <span className="hidden sm:inline">{view.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

// ========================================
// VIEW SWITCHER (DROPDOWN ALTERNATIVE)
// ========================================

export function ViewSwitcherDropdown() {
  const { viewState, setView } = useProjectDatabase()

  const views: Array<{
    value: DatabaseView
    label: string
    icon: React.ReactNode
    description: string
  }> = [
    {
      value: 'table',
      label: 'Table',
      icon: <Table className="h-4 w-4" />,
      description: 'Spreadsheet view with all properties',
    },
    {
      value: 'board',
      label: 'Board',
      icon: <LayoutGrid className="h-4 w-4" />,
      description: 'Kanban board grouped by status',
    },
    {
      value: 'timeline',
      label: 'Timeline',
      icon: <CalendarRange className="h-4 w-4" />,
      description: 'Gantt-style timeline view',
    },
    {
      value: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Monthly calendar with deadlines',
    },
  ]

  const currentView = views.find((v) => v.value === viewState.view)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {currentView?.icon}
          <span>{currentView?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {views.map((view) => (
          <DropdownMenuItem
            key={view.value}
            onClick={() => setView(view.value)}
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <div className="mt-0.5">{view.icon}</div>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{view.label}</span>
                {viewState.view === view.value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {view.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
