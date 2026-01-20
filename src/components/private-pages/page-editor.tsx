'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import { createPortal } from 'react-dom'
import { updatePage, deletePage } from '@/lib/actions/pages'
import { createBlock, updateBlock, deleteBlock, insertBlockAt, reorderBlocks } from '@/lib/actions/blocks'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    MoreHorizontal,
    Star,
    Trash2,
    Image as ImageIcon,
} from 'lucide-react'
import { BlockRenderer } from './block-renderer'
import { BlockWrapper } from './block-wrapper'
import { SlashMenu } from './slash-menu'
import { Block, BlockType, getDefaultBlockContent } from './types'

// ========================================
// TYPES
// ========================================

interface PageBlock {
    id: string
    type: string
    content: Record<string, unknown>
    sortOrder: number
    parentBlockId?: string | null
    childBlocks?: PageBlock[]
    databaseView?: unknown
}

interface PageData {
    id: string
    title: string
    icon: string | null
    coverImage: string | null
    isFavorited: boolean
    blocks: PageBlock[]
}

interface PageEditorProps {
    page: PageData
}

// ========================================
// PAGE EDITOR COMPONENT
// ========================================

export function PageEditor({ page }: PageEditorProps) {
    const router = useRouter()
    const [title, setTitle] = useState(page.title)
    const [icon, setIcon] = useState(page.icon || '📄')
    const [coverImage, setCoverImage] = useState(page.coverImage)
    const [isFavorited, setIsFavorited] = useState(page.isFavorited)
    const [blocks, setBlocks] = useState<PageBlock[]>(page.blocks)
    const [isSaving, setIsSaving] = useState(false)
    const [slashMenuOpen, setSlashMenuOpen] = useState(false)
    const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 })
    const [insertAfterBlockId, setInsertAfterBlockId] = useState<string | null>(null)
    const [activeDragId, setActiveDragId] = useState<string | null>(null)
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)
    const titleRef = useRef<HTMLInputElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const focusedBlockIdRef = useRef<string | null>(null) // Persists across renders

    // Dnd Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Minimum distance to start dragging
            },
        })
    )

    // Autosave title changes
    const saveTitle = useCallback(async (newTitle: string) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(async () => {
            setIsSaving(true)
            await updatePage(page.id, { title: newTitle })
            setIsSaving(false)
            router.refresh()
        }, 500)
    }, [page.id, router])

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value
        setTitle(newTitle)
        saveTitle(newTitle)
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            titleRef.current?.blur()
            // Focus first block or create one
            if (blocks.length === 0) {
                handleAddFirstBlock()
            }
        }
    }

    const handleToggleFavorite = async () => {
        setIsFavorited(!isFavorited)
        await updatePage(page.id, { isFavorited: !isFavorited })
        router.refresh()
    }

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this page?')) {
            await deletePage(page.id)
            router.push('/dashboard')
            router.refresh()
        }
    }

    const handleIconChange = async (newIcon: string) => {
        setIcon(newIcon)
        await updatePage(page.id, { icon: newIcon })
        router.refresh()
    }

    const handleAddCover = async () => {
        const defaultCover = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
        setCoverImage(defaultCover)
        await updatePage(page.id, { coverImage: defaultCover })
        router.refresh()
    }

    const handleRemoveCover = async () => {
        setCoverImage(null)
        await updatePage(page.id, { coverImage: null })
        router.refresh()
    }

    const handleChangeCover = async () => {
        const url = prompt('Enter image URL (Unsplash, etc):', coverImage || '')
        if (url) {
            setCoverImage(url)
            await updatePage(page.id, { coverImage: url })
            router.refresh()
        }
    }

    // Block operations
    const handleAddFirstBlock = async () => {
        const result = await createBlock({
            pageId: page.id,
            type: 'TEXT' as BlockType,
            content: { text: '' },
        })
        if (result.success && result.block) {
            setBlocks([...blocks, result.block as PageBlock])
            router.refresh()
        }
    }

    const handleBlockUpdate = async (blockId: string, content: Record<string, unknown>) => {
        // Optimistic update
        setBlocks(blocks.map(b => b.id === blockId ? { ...b, content } : b))

        // Debounced save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(async () => {
            await updateBlock(blockId, { content })
        }, 300)
    }

    const handleBlockDelete = async (blockId: string) => {
        // Optimistic update
        setBlocks(blocks.filter(b => b.id !== blockId))
        await deleteBlock(blockId)
        router.refresh()
    }

    const handleAddBlock = async (type: BlockType, afterBlockId: string | null) => {
        const content = getDefaultBlockContent(type)
        const result = await insertBlockAt(page.id, type as any, afterBlockId, content)
        if (result.success && result.block) {
            // Check if this is a nested block (inside a toggle)
            const isNestedBlock = afterBlockId?.includes('_nested_start')

            if (isNestedBlock) {
                // For nested blocks, do optimistic update by adding to parent's childBlocks
                const parentId = afterBlockId!.replace('_nested_start', '')
                const newBlocks = blocks.map(b => {
                    if (b.id === parentId) {
                        return {
                            ...b,
                            childBlocks: [...(b.childBlocks || []), result.block as PageBlock]
                        }
                    }
                    return b
                })
                setBlocks(newBlocks)
                setFocusedBlockId(result.block.id)
            } else {
                // Insert at correct position for top-level blocks
                if (afterBlockId) {
                    const idx = blocks.findIndex(b => b.id === afterBlockId)
                    if (idx !== -1) {
                        const newBlocks = [...blocks]
                        newBlocks.splice(idx + 1, 0, result.block as PageBlock)
                        setBlocks(newBlocks)
                        setFocusedBlockId(result.block.id)
                    } else {
                        // If not found, refresh to get the latest state
                        focusedBlockIdRef.current = result.block.id
                        router.refresh()
                    }
                } else {
                    setBlocks([result.block as PageBlock, ...blocks])
                    setFocusedBlockId(result.block.id)
                }
            }
        }
        setSlashMenuOpen(false)
    }

    const handleOpenSlashMenu = (afterBlockId: string | null, e?: React.MouseEvent) => {
        setInsertAfterBlockId(afterBlockId)
        if (e) {
            setSlashMenuPosition({ x: e.clientX, y: e.clientY })
        } else if (contentRef.current) {
            const rect = contentRef.current.getBoundingClientRect()
            setSlashMenuPosition({ x: rect.left + 40, y: rect.top + 100 })
        }
        setSlashMenuOpen(true)
    }

    const handleSlashMenuSelect = (type: BlockType) => {
        handleAddBlock(type, insertAfterBlockId)
    }

    // Drag and Drop Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveDragId(null)

        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex((b) => b.id === active.id)
            const newIndex = blocks.findIndex((b) => b.id === over.id)

            const newBlocks = arrayMove(blocks, oldIndex, newIndex)
            setBlocks(newBlocks) // Optimistic update

            await reorderBlocks(page.id, newBlocks.map(b => b.id))
            router.refresh()
        }
    }

    const dropAnimationConfig: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.4',
                },
            },
        }),
    }

    // Keyboard "/" detection for empty page
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && blocks.length === 0 && !slashMenuOpen) {
                e.preventDefault()
                handleOpenSlashMenu(null)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [blocks.length, slashMenuOpen])

    // Focus title on mount if it's "Untitled"
    useEffect(() => {
        if (page.title === 'Untitled' && titleRef.current) {
            titleRef.current.focus()
            titleRef.current.select()
        }
    }, [page.title])


    // Apply focus from ref after page updates (for nested blocks after refresh)
    useEffect(() => {
        if (focusedBlockIdRef.current) {
            // Small delay to ensure DOM is fully updated
            setTimeout(() => {
                setFocusedBlockId(focusedBlockIdRef.current)
                focusedBlockIdRef.current = null // Clear after applying
            }, 150)
        }
    }, [page.blocks]) // Trigger when blocks update from server

    const activeBlock = activeDragId ? blocks.find(b => b.id === activeDragId) : null

    return (
        <div className="flex-1 flex flex-col w-full h-full">
            {/* Cover Image */}
            {coverImage && (
                <div className="group relative w-full h-48 md:h-60 bg-muted shrink-0">
                    <img
                        src={coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button variant="secondary" size="sm" onClick={handleChangeCover} className="text-xs h-7">
                            Change cover
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleRemoveCover} className="text-xs h-7">
                            Remove
                        </Button>
                    </div>
                </div>
            )}

            {/* Page Content Container */}
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                {/* Page Header */}
                <div className="px-8 pt-16 pb-8 group/header">
                    {/* Top Actions */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            {/* Icon Button */}
                            <div className="relative group/icon">
                                <button
                                    onClick={() => {
                                        const emojis = ['📄', '📝', '📋', '📊', '🎯', '💡', '🚀', '⭐', '📌', '🔖', '📚', '🎨']
                                        const currentIndex = emojis.indexOf(icon)
                                        const nextIndex = (currentIndex + 1) % emojis.length
                                        handleIconChange(emojis[nextIndex])
                                    }}
                                    className="text-4xl hover:bg-accent/50 rounded-lg p-2 transition-colors"
                                    title="Click to change icon"
                                >
                                    {icon}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-100 transition-opacity">

                            {isSaving && (
                                <span className="text-xs text-muted-foreground mr-2">Saving...</span>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleToggleFavorite}
                                className={cn(isFavorited && "text-yellow-500")}
                            >
                                <Star className={cn("h-4 w-4", isFavorited && "fill-current")} />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleToggleFavorite}>
                                        <Star className="h-4 w-4 mr-2" />
                                        {isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleAddCover}>
                                        <ImageIcon className="h-4 w-4 mr-2" />
                                        Add cover image
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete page
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Title */}
                    <input
                        ref={titleRef}
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        onKeyDown={handleTitleKeyDown}
                        placeholder="Untitled"
                        className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 focus:ring-0"
                    />
                </div>

                {/* Page Content */}
                <div ref={contentRef} className="flex-1 px-8 pb-16">
                    {blocks.length === 0 ? (
                        <button
                            onClick={(e) => handleOpenSlashMenu(null, e)}
                            className="py-4 text-muted-foreground hover:text-foreground transition-colors text-left w-full"
                        >
                            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">/</kbd> for commands, or click here to add a block...
                        </button>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={blocks.map(b => b.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-0.5">
                                    {blocks.map((block) => (
                                        <BlockWrapper
                                            key={block.id}
                                            block={block as Block}
                                            onDelete={() => handleBlockDelete(block.id)}
                                            onDuplicate={() => {/* TODO */ }}
                                            onAddBlock={(type) => handleAddBlock(type, block.id)}
                                            onOpenSlashMenu={() => handleOpenSlashMenu(block.id)}
                                        >
                                            <BlockRenderer
                                                block={block as Block}
                                                onUpdate={(content) => handleBlockUpdate(block.id, content)}
                                                onDelete={() => handleBlockDelete(block.id)}
                                                onAddBlock={(type, afterId) => handleAddBlock(type, afterId)}
                                                onOpenSlashMenu={() => handleOpenSlashMenu(block.id)}
                                                focusedBlockId={focusedBlockId}
                                            />
                                        </BlockWrapper>
                                    ))}
                                </div>
                            </SortableContext>
                            {createPortal(
                                <DragOverlay dropAnimation={dropAnimationConfig}>
                                    {activeBlock ? (
                                        <BlockWrapper
                                            block={activeBlock as Block}
                                            onDelete={() => { }}
                                            onDuplicate={() => { }}
                                            onAddBlock={() => { }}
                                            onOpenSlashMenu={() => { }}
                                            isDragging
                                        >
                                            <div className="pointer-events-none">
                                                <BlockRenderer
                                                    block={activeBlock as Block}
                                                    onUpdate={() => { }}
                                                    onDelete={() => { }}
                                                    onAddBlock={() => { }}
                                                    onOpenSlashMenu={() => { }}
                                                    focusedBlockId={focusedBlockId}
                                                />
                                            </div>
                                        </BlockWrapper>
                                    ) : null}
                                </DragOverlay>,
                                document.body
                            )}
                        </DndContext>
                    )}
                </div>

                {/* Slash Menu */}
                <SlashMenu
                    isOpen={slashMenuOpen}
                    onClose={() => setSlashMenuOpen(false)}
                    onSelect={handleSlashMenuSelect}
                    position={slashMenuPosition}
                />
            </div>
        </div>
    )
}
