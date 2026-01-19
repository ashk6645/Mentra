'use client'

import React from 'react'
import {
  Table,
  LayoutGrid,
  Calendar,
  CalendarRange,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjectDatabase } from './project-database-context'
import { DatabaseView } from './types'

// ========================================
// VIEW SWITCHER (Underline Tabs Style)
// ========================================

export function ViewSwitcher() {
  const { viewState, setView } = useProjectDatabase()

  const views: Array<{
    value: DatabaseView
    label: string
    icon: React.ReactNode
  }> = [
      {
        value: 'table',
        label: 'Table',
        icon: <Table className="h-4 w-4" />,
      },
      {
        value: 'board',
        label: 'Board',
        icon: <LayoutGrid className="h-4 w-4" />,
      },
      {
        value: 'timeline',
        label: 'Timeline',
        icon: <CalendarRange className="h-4 w-4" />,
      },
      {
        value: 'calendar',
        label: 'Calendar',
        icon: <Calendar className="h-4 w-4" />,
      },
    ]

  return (
    <div className="flex items-center gap-1">
      {views.map((view) => {
        const isActive = viewState.view === view.value
        return (
          <button
            key={view.value}
            onClick={() => setView(view.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            {view.icon}
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ========================================
// VIEW SWITCHER DROPDOWN (Alternative)
// ========================================

export function ViewSwitcherDropdown() {
  const { viewState, setView } = useProjectDatabase()

  // Keeping dropdown version in case needed for mobile
  return null
}
