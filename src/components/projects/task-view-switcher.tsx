"use client"

import React from 'react'
import {
    Table,
    LayoutGrid,
    KanbanSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type TaskViewType = 'board' | 'table' | 'gallery'

interface TaskViewSwitcherProps {
    currentView: TaskViewType
    onViewChange: (view: TaskViewType) => void
}

export function TaskViewSwitcher({ currentView, onViewChange }: TaskViewSwitcherProps) {
    const views: Array<{
        value: TaskViewType
        label: string
        icon: React.ReactNode
    }> = [
            {
                value: 'board',
                label: 'Board',
                icon: <KanbanSquare className="h-4 w-4" />,
            },
            {
                value: 'table',
                label: 'Table',
                icon: <Table className="h-4 w-4" />,
            },
            {
                value: 'gallery',
                label: 'Gallery',
                icon: <LayoutGrid className="h-4 w-4" />,
            },
        ]

    return (
        <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-lg border border-border/40">
            {views.map((view) => {
                const isActive = currentView === view.value
                return (
                    <button
                        key={view.value}
                        onClick={() => onViewChange(view.value)}
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
