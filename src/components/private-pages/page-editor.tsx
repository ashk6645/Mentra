'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { updatePage, deletePage } from '@/lib/actions/pages'
import { createBlock, updateBlock, deleteBlock, reorderBlocks, insertBlockAt } from '@/lib/actions/blocks'
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
import { Block, BlockType } from '@/components/editor/types'
import { BlockEditor } from '@/components/editor/block-editor'
import { IconPicker } from '@/components/private-pages/icon-picker'

// ========================================
// TYPES
// ========================================

interface PageData {
    id: string
    title: string
    icon: string | null
    coverImage: string | null
    isFavorited: boolean
    blocks: any[] // We cast this to Block[] for the editor
    currentUserPermission?: string // 'view', 'edit', 'admin', 'owner'
}

interface PageEditorProps {
    page: PageData
}

// ========================================
// PAGE EDITOR COMPONENT
// ========================================

import { SharePageDialog } from '@/components/private-pages/share-page-dialog'

export function PageEditor({ page }: PageEditorProps) {
    const router = useRouter()
    const [title, setTitle] = useState(page.title)
    const [icon, setIcon] = useState(page.icon || '📄')
    const [coverImage, setCoverImage] = useState(page.coverImage)
    const [isFavorited, setIsFavorited] = useState(page.isFavorited)
    const [isSaving, setIsSaving] = useState(false)
    const titleRef = useRef<HTMLInputElement>(null)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const canEdit = page.currentUserPermission !== 'view'
    const isOwner = page.currentUserPermission === 'owner'
    const isAdmin = page.currentUserPermission === 'admin'
    const canShare = isOwner || isAdmin

    // Autosave title changes
    const saveTitle = useCallback(async (newTitle: string) => {
        if (!canEdit) return

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(async () => {
            setIsSaving(true)
            try {
                await updatePage(page.id, { title: newTitle })
                // Don't refresh immediately - let user continue typing
            } catch (error) {
                console.error('Error saving title:', error)
            } finally {
                setIsSaving(false)
            }
        }, 1000) // Increased from 200ms to 1000ms (1 second)
    }, [page.id, canEdit])

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!canEdit) return
        const newTitle = e.target.value
        setTitle(newTitle)
        saveTitle(newTitle)
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            titleRef.current?.blur()
            // In a real implementation, we could focus the first block of the editor here
        }
    }

    const handleToggleFavorite = async () => {
        setIsFavorited(!isFavorited)
        await updatePage(page.id, { isFavorited: !isFavorited })
        router.refresh()
    }

    const handleDelete = async () => {
        if (!isOwner) return
        if (confirm('Are you sure you want to delete this page?')) {
            await deletePage(page.id)
            router.push('/dashboard')
            router.refresh()
        }
    }

    const handleIconChange = async (newIcon: string) => {
        if (!canEdit) return
        setIcon(newIcon)
        await updatePage(page.id, { icon: newIcon })
        router.refresh()
    }

    const handleAddCover = async () => {
        if (!canEdit) return
        const defaultCover = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
        setCoverImage(defaultCover)
        await updatePage(page.id, { coverImage: defaultCover })
        router.refresh()
    }

    const handleRemoveCover = async () => {
        if (!canEdit) return
        setCoverImage(null)
        await updatePage(page.id, { coverImage: null })
        router.refresh()
    }

    const handleChangeCover = async () => {
        if (!canEdit) return
        const url = prompt('Enter image URL (Unsplash, etc):', coverImage || '')
        if (url) {
            setCoverImage(url)
            await updatePage(page.id, { coverImage: url })
            router.refresh()
        }
    }

    // Persistence Handlers for BlockEditor

    const handleCreateBlock = async (block: Block, afterBlockId?: string) => {
        if (!canEdit) return
        setIsSaving(true)
        try {
            if (afterBlockId) {
                // Use insertBlockAt to handle positioning correctly
                await insertBlockAt(
                    page.id,
                    block.type,
                    afterBlockId,
                    block.content,
                    block.id
                )
            } else {
                // Append to end: let server calculate max sortOrder
                await createBlock({
                    id: block.id,
                    pageId: page.id,
                    type: block.type,
                    content: block.content,
                    parentBlockId: block.parentId,
                    // valid: undefined sortOrder triggers server-side max+1 calculation
                    sortOrder: undefined
                })
            }
        } catch (error) {
            console.error('Error creating block:', error)
            // Ideally we'd rollback here, but we'll rely on refresh for now to fix state
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdateBlock = async (id: string, updates: any) => {
        if (!canEdit) return
        console.log('PageEditor handleUpdateBlock called:', id, updates)
        // Debounced save for content updates
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(async () => {
            console.log('PageEditor execution save for:', id)
            setIsSaving(true)
            try {
                // Map updates from BlockEditor to the expected format for updateBlock action
                const payload: any = {}
                if (updates.content !== undefined) payload.content = updates.content
                if (updates.type !== undefined) payload.type = updates.type
                if (updates.sortOrder !== undefined) payload.sortOrder = updates.sortOrder

                await updateBlock(id, payload)
            } catch (error) {
                console.error('Error saving block:', error)
            } finally {
                setIsSaving(false)
            }
        }, 1000)
    }

    const handleDeleteBlock = async (id: string) => {
        if (!canEdit) return
        setIsSaving(true)
        try {
            await deleteBlock(id)
        } catch (error) {
            console.error('Error deleting block:', error)
            // If deletion fails, we should ideally restore the block
            // For now, alerting the user and refreshing might be best
            alert('Failed to delete block. Please refresh.')
            router.refresh()
        } finally {
            setIsSaving(false)
        }
    }

    const handleReorderBlocks = async (newBlocks: Block[]) => {
        if (!canEdit) return
        setIsSaving(true)
        try {
            // Update sortOrder for each block based on its new position
            const blocksWithUpdatedOrder = newBlocks.map((block, index) => ({
                ...block,
                sortOrder: index
            }))

            // Save the new order to database
            const ids = blocksWithUpdatedOrder.map(b => b.id)
            await reorderBlocks(page.id, ids)

            // Don't refresh immediately - blocks are already reordered in local state
        } catch (error) {
            console.error('Error reordering blocks:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleChange = async (newBlocks: Block[]) => {
        // Handled by specific events
    }

    return (
        <div className="flex-1 flex flex-col w-full h-full bg-background">
            {/* Cover Image */}
            {coverImage && (
                <div className="group relative w-full h-48 md:h-60 bg-muted shrink-0">
                    <img
                        src={coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                    {canEdit && (
                        <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <Button variant="secondary" size="sm" onClick={handleChangeCover} className="text-xs h-7">
                                Change cover
                            </Button>
                            <Button variant="secondary" size="sm" onClick={handleRemoveCover} className="text-xs h-7">
                                Remove
                            </Button>
                        </div>
                    )}
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
                                {canEdit ? (
                                    <IconPicker onIconSelect={handleIconChange} currentIcon={icon}>
                                        <button
                                            className="text-4xl hover:bg-accent/50 rounded-lg p-2 transition-colors"
                                            title="Click to change icon"
                                        >
                                            {icon}
                                        </button>
                                    </IconPicker>
                                ) : (
                                    <div className="text-4xl p-2">{icon}</div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                            {isSaving && (
                                <span className="text-xs text-muted-foreground mr-2">Saving...</span>
                            )}

                            {canShare && (
                                <SharePageDialog
                                    pageId={page.id}
                                    pageTitle={page.title}
                                    isOwner={isOwner}
                                />
                            )}

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleToggleFavorite}
                                className={cn(isFavorited && "text-yellow-500")}
                            >
                                <Star className={cn("h-4 w-4", isFavorited && "fill-current")} />
                            </Button>

                            {(isOwner || canEdit) && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" suppressHydrationWarning>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleToggleFavorite}>
                                            <Star className="h-4 w-4 mr-2" />
                                            {isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                                        </DropdownMenuItem>
                                        {canEdit && (
                                            <DropdownMenuItem onClick={handleAddCover}>
                                                <ImageIcon className="h-4 w-4 mr-2" />
                                                Add cover image
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        {isOwner && (
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={handleDelete}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete page
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
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
                        disabled={!canEdit}
                        className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-80"
                    />
                </div>

                {/* Block Editor */}
                <div className="flex-1 px-8 pb-16">
                    <BlockEditor
                        initialBlocks={page.blocks as Block[]}
                        onCreateBlock={handleCreateBlock}
                        onUpdateBlock={handleUpdateBlock}
                        onDeleteBlock={handleDeleteBlock}
                        onReorderBlocks={handleReorderBlocks}
                        readOnly={!canEdit}
                    />
                </div>
            </div>
        </div>
    )
}