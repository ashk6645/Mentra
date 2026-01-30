'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Block, BlockType, ViewType } from '../types'
import {
    Table, LayoutGrid, List, Calendar, BarChart3,
    ChevronDown, Plus, MoreHorizontal, Settings, Expand
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
    getDatabaseItems,
    createDatabaseItem,
    updateDatabaseItem,
    deleteDatabaseItem,
    getDatabaseProperties,
    initializeDatabaseProperties,
} from '@/lib/actions/database-items'
import { ItemModal } from './database/item-modal'

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

interface DatabaseItem {
    id: string
    blockId: string
    title: string
    icon: string | null
    cover?: string
    status: 'Not started' | 'In progress' | 'Done'
    priority?: 'High' | 'Medium' | 'Low'
    date?: string
    properties: Record<string, any>
    sortOrder: number
}

interface DatabaseProperty {
    id: string
    name: string
    type: string
    options?: { id: string; name: string; color: string }[]
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

// ========================================
// MAIN COMPONENT
// ========================================

export function DatabaseBlock({
    block,
    onUpdate,
    viewType: initialViewType,
}: DatabaseBlockProps) {
    const content = block.content as { title?: string; viewType?: ViewType }

    const [title, setTitle] = useState(content.title || 'Untitled Database')
    const [viewType, setViewType] = useState<ViewType>(content.viewType || initialViewType)
    const [items, setItems] = useState<DatabaseItem[]>([])
    const [properties, setProperties] = useState<DatabaseProperty[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedItem, setSelectedItem] = useState<DatabaseItem | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Load data
    useEffect(() => {
        loadData()
        initializeProperties()
    }, [block.id])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [itemsResult, propsResult] = await Promise.all([
                getDatabaseItems(block.id),
                getDatabaseProperties(block.id),
            ])

            if (itemsResult.success) {
                const mappedItems = (itemsResult.items as any[]).map(item => ({
                    ...item,
                    cover: item.coverImage || undefined,
                    status: (item.properties as any)?.status || 'Not started',
                    priority: (item.properties as any)?.priority,
                    date: (item.properties as any)?.date,
                }))
                setItems(mappedItems as DatabaseItem[])
            }
            if (propsResult.success) {
                setProperties(propsResult.properties as DatabaseProperty[])
            }
        } catch (error) {
            console.error('Error loading database data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const initializeProperties = async () => {
        await initializeDatabaseProperties(block.id)
        const propsResult = await getDatabaseProperties(block.id)
        if (propsResult.success) {
            setProperties(propsResult.properties as DatabaseProperty[])
        }
    }

    const handleChangeView = (newViewType: ViewType) => {
        setViewType(newViewType)
        onUpdate({ ...content, viewType: newViewType })
    }

    const handleAddItem = async () => {
        const result = await createDatabaseItem({
            blockId: block.id,
            title: 'Untitled',
            properties: { status: 'not_started' },
        })

        if (result.success && result.item) {
            const props = (result.item.properties as any) || {}
            const newItem = {
                ...(result.item as any),
                cover: result.item.coverImage || undefined,
                status: props.status || 'Not started',
                priority: props.priority,
                date: props.date,
            } as DatabaseItem

            setItems([...items, newItem])
            // Open the modal for the new item
            setSelectedItem(newItem)
            setIsModalOpen(true)
        }
    }

    const handleOpenItem = (item: DatabaseItem) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleUpdateItem = async (id: string, data: Partial<DatabaseItem>) => {
        const result = await updateDatabaseItem(id, data as any)
        if (result.success) {
            setItems(items.map(item => item.id === id ? { ...item, ...data } : item))
            if (selectedItem?.id === id) {
                setSelectedItem({ ...selectedItem, ...data })
            }
        }
    }

    const handleDeleteItem = async (id: string) => {
        const result = await deleteDatabaseItem(id)
        if (result.success) {
            setItems(items.filter(item => item.id !== id))
            if (selectedItem?.id === id) {
                setIsModalOpen(false)
                setSelectedItem(null)
            }
        }
    }

    const currentView = VIEW_TYPES.find(v => v.type === viewType) || VIEW_TYPES[0]

    return (
        <>
            {/* Notion-style Database Block */}
            <div className="my-1 rounded-md overflow-hidden bg-background border border-border/40 shadow-sm hover:shadow-md transition-shadow">
                {/* Header - Notion style */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30 border-b border-border/40">
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value)
                                onUpdate({ ...content, title: e.target.value })
                            }}
                            className="font-semibold text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground/50"
                            placeholder="Untitled Database"
                        />
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* View Switcher - Notion style */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50">
                                    {currentView.icon}
                                    <span>{currentView.label}</span>
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                {VIEW_TYPES.map((view) => (
                                    <DropdownMenuItem
                                        key={view.type}
                                        onClick={() => handleChangeView(view.type)}
                                        className={cn(
                                            "flex items-center gap-2 text-sm",
                                            viewType === view.type && "bg-accent font-medium"
                                        )}
                                    >
                                        {view.icon}
                                        <span>{view.label}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* New Button - Notion style */}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 gap-1 text-xs hover:bg-accent/50"
                            onClick={handleAddItem}
                        >
                            <Plus className="h-3 w-3" />
                            New
                        </Button>

                        {/* More Options */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Settings className="h-3.5 w-3.5 mr-2" />
                                    Properties
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Expand className="h-3.5 w-3.5 mr-2" />
                                    Full page
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Content */}
                <div className="min-h-[120px] bg-background">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                        </div>
                    ) : (
                        <DatabaseViewRenderer
                            viewType={viewType}
                            items={items}
                            properties={properties}
                            onOpenItem={handleOpenItem}
                            onAddItem={handleAddItem}
                            onUpdateItem={handleUpdateItem}
                        />
                    )}
                </div>
            </div>

            {/* Item Modal */}
            <ItemModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setSelectedItem(null)
                }}
                item={selectedItem}
                properties={properties}
                pageId={block.pageId}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
            />
        </>
    )
}

// ========================================
// VIEW RENDERER
// ========================================

interface ViewRendererProps {
    viewType: ViewType
    items: DatabaseItem[]
    properties: DatabaseProperty[]
    onOpenItem: (item: DatabaseItem) => void
    onAddItem: () => void
    onUpdateItem: (id: string, data: Partial<DatabaseItem>) => void
}

function DatabaseViewRenderer({
    viewType,
    items,
    properties,
    onOpenItem,
    onAddItem,
    onUpdateItem,
}: ViewRendererProps) {
    switch (viewType) {
        case 'TABLE':
            return (
                <TableView
                    viewType={viewType}
                    items={items}
                    properties={properties}
                    onOpenItem={onOpenItem}
                    onAddItem={onAddItem}
                    onUpdateItem={onUpdateItem}
                />
            )
        case 'BOARD':
            return (
                <BoardView
                    viewType={viewType}
                    items={items}
                    properties={properties}
                    onOpenItem={onOpenItem}
                    onAddItem={onAddItem}
                />
            )
        case 'GALLERY':
            return (
                <GalleryView
                    items={items}
                    onOpenItem={onOpenItem}
                    onAddItem={onAddItem}
                />
            )
        case 'LIST':
            return (
                <ListView
                    items={items}
                    onOpenItem={onOpenItem}
                    onAddItem={onAddItem}
                />
            )
        default:
            return (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    {viewType} view coming soon
                </div>
            )
    }
}

// ========================================
// TABLE VIEW
// ========================================

function TableView({
    items,
    properties,
    onOpenItem,
    onAddItem,
    onUpdateItem,
}: ViewRendererProps) {
    const statusProperty = properties.find(p => p.type === 'SELECT')

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b border-border/40">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide w-[280px] bg-muted/20">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base">📄</span>
                                <span>Name</span>
                            </div>
                        </th>
                        {properties.map((prop) => (
                            <th key={prop.id} className="text-left py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide bg-muted/20">
                                {prop.name}
                            </th>
                        ))}
                        <th className="py-2 px-3 text-left text-muted-foreground bg-muted/20 w-8">
                            <button className="text-xs hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                +
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr
                            key={item.id}
                            className={cn(
                                "border-b border-border/30 hover:bg-accent/30 group transition-colors",
                                index % 2 === 0 ? "bg-background" : "bg-muted/10"
                            )}
                        >
                            <td className="py-2 px-3">
                                <button
                                    onClick={() => onOpenItem(item)}
                                    className="flex items-center gap-2 hover:text-primary text-left w-full group/cell"
                                >
                                    <Expand className="h-3 w-3 opacity-0 group-hover/cell:opacity-50 transition-opacity" />
                                    <span className="text-sm">{item.icon || '📄'}</span>
                                    <span className="truncate font-medium">{item.title}</span>
                                </button>
                            </td>
                            {properties.map((prop) => (
                                <td key={prop.id} className="py-2 px-3">
                                    {prop.type === 'SELECT' && (
                                        <StatusBadge
                                            value={item.properties[prop.id] || item.properties.status}
                                            options={prop.options || []}
                                            onChange={(value) => onUpdateItem(item.id, {
                                                properties: { ...item.properties, [prop.id]: value }
                                            })}
                                        />
                                    )}
                                    {prop.type === 'TEXT' && (
                                        <span className="text-sm text-muted-foreground">
                                            {item.properties[prop.id] || '—'}
                                        </span>
                                    )}
                                </td>
                            ))}
                            <td></td>
                        </tr>
                    ))}
                    {/* Add row */}
                    <tr className="hover:bg-accent/20 transition-colors">
                        <td colSpan={properties.length + 2} className="py-2 px-3">
                            <button
                                onClick={onAddItem}
                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm w-full"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>New</span>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

// ========================================
// STATUS BADGE
// ========================================

function StatusBadge({
    value,
    options,
    onChange,
}: {
    value: string
    options: { id: string; name: string; color: string }[]
    onChange: (value: string) => void
}) {
    const current = options.find(o => o.id === value) || options[0]

    const colorClasses: Record<string, string> = {
        gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    }

    if (!current) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    colorClasses[current.color] || colorClasses.gray
                )}>
                    {current.name}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className={cn(value === option.id && "bg-accent")}
                    >
                        <span className={cn(
                            "w-2 h-2 rounded-full mr-2",
                            option.color === 'gray' && "bg-gray-500",
                            option.color === 'blue' && "bg-blue-500",
                            option.color === 'green' && "bg-green-500",
                        )} />
                        {option.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// ========================================
// BOARD VIEW (Kanban)
// ========================================

function BoardView({
    items,
    properties,
    onOpenItem,
    onAddItem,
}: Omit<ViewRendererProps, 'onUpdateItem'>) {
    const statusProperty = properties.find(p => p.name === 'Status' || p.type === 'SELECT')
    const propertyId = statusProperty?.id || 'status'

    const statuses = statusProperty?.options || [
        { id: 'not_started', name: 'Not started', color: 'gray' },
        { id: 'in_progress', name: 'In progress', color: 'blue' },
        { id: 'done', name: 'Done', color: 'green' },
    ]

    const groupedItems = statuses.reduce((acc, status) => {
        acc[status.id] = items.filter(item => {
            const itemValue = item.properties[propertyId] || item.properties.status || 'not_started'
            return itemValue === status.id
        })
        return acc
    }, {} as Record<string, DatabaseItem[]>)

    return (
        <div className="flex gap-4 p-4 overflow-x-auto">
            {statuses.map((status) => (
                <div key={status.id} className="flex-shrink-0 w-72 bg-muted/20 rounded-lg">
                    {/* Column Header - Notion style */}
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                status.color === 'gray' && "bg-gray-400",
                                status.color === 'blue' && "bg-blue-500",
                                status.color === 'green' && "bg-green-500",
                                status.color === 'red' && "bg-red-500",
                                status.color === 'yellow' && "bg-yellow-500",
                            )} />
                            <span className="text-sm font-medium">{status.name}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {groupedItems[status.id]?.length || 0}
                            </span>
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="p-2 space-y-2 min-h-[200px]">
                        {(groupedItems[status.id] || []).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onOpenItem(item)}
                                className="w-full bg-background border border-border/40 rounded-md p-3 text-left hover:shadow-md hover:border-border transition-all group"
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-base">{item.icon || '📄'}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{item.title}</div>
                                        {item.properties.description && (
                                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {item.properties.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}

                        {/* Add Card */}
                        <button
                            onClick={onAddItem}
                            className="w-full flex items-center gap-2 p-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ========================================
// GALLERY VIEW
// ========================================

function GalleryView({
    items,
    onOpenItem,
    onAddItem,
}: Pick<ViewRendererProps, 'items' | 'onOpenItem' | 'onAddItem'>) {
    return (
        <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onOpenItem(item)}
                        className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow text-left"
                    >
                        {/* Cover Image */}
                        <div className="aspect-video bg-muted flex items-center justify-center">
                            {item.cover ? (
                                <img src={item.cover} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl">{item.icon || '📄'}</span>
                            )}
                        </div>
                        {/* Title */}
                        <div className="p-3">
                            <span className="text-sm font-medium">{item.title}</span>
                        </div>
                    </button>
                ))}

                {/* Add Card */}
                <button
                    onClick={onAddItem}
                    className="border border-dashed border-border rounded-lg overflow-hidden hover:border-primary/50 hover:bg-accent/30 transition-all text-left group"
                >
                    <div className="aspect-video flex items-center justify-center">
                        <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="p-3">
                        <span className="text-sm text-muted-foreground group-hover:text-foreground">New page</span>
                    </div>
                </button>
            </div>
        </div>
    )
}

// ========================================
// LIST VIEW
// ========================================

function ListView({
    items,
    onOpenItem,
    onAddItem,
}: Pick<ViewRendererProps, 'items' | 'onOpenItem' | 'onAddItem'>) {
    return (
        <div className="py-2">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onOpenItem(item)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent/50 transition-colors text-left"
                >
                    <span className="text-lg">{item.icon || '📄'}</span>
                    <span className="text-sm flex-1">{item.title}</span>
                </button>
            ))}

            <button
                onClick={onAddItem}
                className="w-full flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
            >
                <Plus className="h-4 w-4" />
                <span className="text-sm">New page</span>
            </button>
        </div>
    )
}
