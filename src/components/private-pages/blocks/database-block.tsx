'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Block, BlockType, SourceType, ViewType } from '../types'
import {
    Database, Table, LayoutGrid, List, Calendar, BarChart3,
    ChevronDown, Plus, Settings, MoreHorizontal
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

// ========================================
// TYPES
// ========================================

interface DatabaseBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string) => void
    viewType: 'TABLE' | 'BOARD' | 'GALLERY' | 'LIST' | 'CALENDAR' | 'CHART'
    isEditing?: boolean
}

interface DatabaseConfig {
    sourceType: SourceType | null
    viewType: ViewType
    title: string
    isConfigured: boolean
}

// ========================================
// VIEW TYPE CONFIG
// ========================================

const VIEW_TYPES: { type: ViewType; label: string; icon: React.ReactNode }[] = [
    { type: 'TABLE', label: 'Table', icon: <Table className="h-4 w-4" /> },
    { type: 'BOARD', label: 'Board', icon: <LayoutGrid className="h-4 w-4" /> },
    { type: 'GALLERY', label: 'Gallery', icon: <LayoutGrid className="h-4 w-4" /> },
    { type: 'LIST', label: 'List', icon: <List className="h-4 w-4" /> },
    { type: 'CALENDAR', label: 'Calendar', icon: <Calendar className="h-4 w-4" /> },
    { type: 'CHART', label: 'Chart', icon: <BarChart3 className="h-4 w-4" /> },
]

const SOURCE_TYPES: { type: SourceType; label: string; description: string }[] = [
    { type: 'TASKS', label: 'Tasks', description: 'Your task database' },
    { type: 'PROJECTS', label: 'Projects', description: 'Your project database' },
    { type: 'HABITS', label: 'Habits', description: 'Your habit tracker' },
]

// ========================================
// DATABASE BLOCK COMPONENT
// ========================================

export function DatabaseBlock({
    block,
    onUpdate,
    viewType,
}: DatabaseBlockProps) {
    const content = block.content as {
        sourceType?: SourceType;
        title?: string;
        isConfigured?: boolean;
    }

    const [config, setConfig] = useState<DatabaseConfig>({
        sourceType: content.sourceType || null,
        viewType: viewType,
        title: content.title || '',
        isConfigured: content.isConfigured || false,
    })

    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState<any[]>([])

    // Fetch data when source is configured
    useEffect(() => {
        if (config.sourceType && config.isConfigured) {
            fetchData()
        }
    }, [config.sourceType, config.isConfigured])

    const fetchData = async () => {
        if (!config.sourceType) return

        setIsLoading(true)
        try {
            // Fetch data based on source type
            const response = await fetch(`/api/private-pages/data?source=${config.sourceType}`)
            if (response.ok) {
                const result = await response.json()
                setData(result.data || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectSource = (sourceType: SourceType) => {
        const newConfig = {
            ...config,
            sourceType,
            title: `${sourceType.charAt(0) + sourceType.slice(1).toLowerCase()} Database`,
            isConfigured: true,
        }
        setConfig(newConfig)
        onUpdate({
            sourceType,
            title: newConfig.title,
            isConfigured: true,
        })
    }

    const handleChangeView = (newViewType: ViewType) => {
        setConfig({ ...config, viewType: newViewType })
    }

    // ========================================
    // CONFIGURATION UI (when not configured)
    // ========================================

    if (!config.isConfigured || !config.sourceType) {
        return (
            <div className="border border-border rounded-lg overflow-hidden">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Database className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-medium">Select a data source</h3>
                            <p className="text-sm text-muted-foreground">
                                Choose which database to display
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        {SOURCE_TYPES.map((source) => (
                            <button
                                key={source.type}
                                onClick={() => handleSelectSource(source.type)}
                                className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent transition-colors text-left"
                            >
                                <Database className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <div className="font-medium">{source.label}</div>
                                    <div className="text-xs text-muted-foreground">{source.description}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // ========================================
    // CONFIGURED DATABASE VIEW
    // ========================================

    const currentView = VIEW_TYPES.find(v => v.type === config.viewType) || VIEW_TYPES[0]

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{config.title}</span>
                </div>

                <div className="flex items-center gap-1">
                    {/* View Switcher */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5">
                                {currentView.icon}
                                <span className="text-xs">{currentView.label}</span>
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {VIEW_TYPES.map((view) => (
                                <DropdownMenuItem
                                    key={view.type}
                                    onClick={() => handleChangeView(view.type)}
                                    className={cn(config.viewType === view.type && "bg-accent")}
                                >
                                    {view.icon}
                                    <span className="ml-2">{view.label}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Settings */}
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Settings className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No items yet</p>
                        <p className="text-xs">Items from {config.sourceType?.toLowerCase()} will appear here</p>
                    </div>
                ) : (
                    <DatabaseViewRenderer
                        viewType={config.viewType}
                        sourceType={config.sourceType}
                        data={data}
                    />
                )}
            </div>
        </div>
    )
}

// ========================================
// VIEW RENDERER
// ========================================

interface DatabaseViewRendererProps {
    viewType: ViewType
    sourceType: SourceType
    data: any[]
}

function DatabaseViewRenderer({ viewType, sourceType, data }: DatabaseViewRendererProps) {
    switch (viewType) {
        case 'TABLE':
            return <TableView data={data} sourceType={sourceType} />
        case 'BOARD':
            return <BoardView data={data} sourceType={sourceType} />
        case 'GALLERY':
            return <GalleryView data={data} sourceType={sourceType} />
        case 'LIST':
            return <ListView data={data} sourceType={sourceType} />
        default:
            return (
                <div className="text-center py-4 text-muted-foreground text-sm">
                    {viewType} view coming soon
                </div>
            )
    }
}

// ========================================
// TABLE VIEW
// ========================================

function TableView({ data, sourceType }: { data: any[]; sourceType: SourceType }) {
    const columns = sourceType === 'TASKS'
        ? ['Title', 'Status', 'Priority', 'Due Date']
        : sourceType === 'PROJECTS'
            ? ['Name', 'Status', 'Progress']
            : ['Name', 'Frequency', 'Streak']

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        {columns.map((col) => (
                            <th key={col} className="text-left py-2 px-3 font-medium text-muted-foreground">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.slice(0, 10).map((item, idx) => (
                        <tr key={item.id || idx} className="border-b border-border/50 hover:bg-accent/30">
                            <td className="py-2 px-3 font-medium">{item.title || item.name}</td>
                            <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-xs bg-muted">
                                    {item.status || 'Active'}
                                </span>
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">
                                {item.priority || item.progress || item.frequency || '-'}
                            </td>
                            {sourceType === 'TASKS' && (
                                <td className="py-2 px-3 text-muted-foreground">
                                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {data.length > 10 && (
                <div className="text-center py-2 text-xs text-muted-foreground">
                    +{data.length - 10} more items
                </div>
            )}
        </div>
    )
}

// ========================================
// BOARD VIEW (Kanban)
// ========================================

function BoardView({ data, sourceType }: { data: any[]; sourceType: SourceType }) {
    const statuses = sourceType === 'TASKS'
        ? ['TODO', 'IN_PROGRESS', 'DONE']
        : sourceType === 'PROJECTS'
            ? ['PLANNING', 'ACTIVE', 'COMPLETED']
            : ['Active']

    const groupedData = statuses.reduce((acc, status) => {
        acc[status] = data.filter(item => (item.status || 'Active').toUpperCase().replace(' ', '_') === status)
        return acc
    }, {} as Record<string, any[]>)

    return (
        <div className="flex gap-3 overflow-x-auto pb-2">
            {statuses.map((status) => (
                <div key={status} className="flex-shrink-0 w-56 bg-muted/30 rounded-lg p-2">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                            {status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 rounded">
                            {groupedData[status]?.length || 0}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {(groupedData[status] || []).slice(0, 5).map((item) => (
                            <div key={item.id} className="bg-background border border-border rounded p-2 text-sm">
                                {item.title || item.name}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ========================================
// GALLERY VIEW
// ========================================

function GalleryView({ data, sourceType }: { data: any[]; sourceType: SourceType }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {data.slice(0, 9).map((item) => (
                <div
                    key={item.id}
                    className="border border-border rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                    <div className="aspect-square bg-muted/50 rounded mb-2 flex items-center justify-center">
                        <span className="text-2xl">{item.icon || '📄'}</span>
                    </div>
                    <div className="font-medium text-sm truncate">{item.title || item.name}</div>
                    <div className="text-xs text-muted-foreground">
                        {item.status || 'Active'}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ========================================
// LIST VIEW
// ========================================

function ListView({ data, sourceType }: { data: any[]; sourceType: SourceType }) {
    return (
        <div className="space-y-1">
            {data.slice(0, 15).map((item) => (
                <div
                    key={item.id}
                    className="flex items-center gap-3 py-2 px-3 hover:bg-accent/30 rounded transition-colors"
                >
                    <span className="text-lg">{item.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.title || item.name}</div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {item.status || 'Active'}
                    </span>
                </div>
            ))}
        </div>
    )
}
