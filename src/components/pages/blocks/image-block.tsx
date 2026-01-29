'use client'

import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Block, BlockType } from '../types'
import { ImageIcon, Upload, X, Link } from 'lucide-react'

interface ImageBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string) => void
    isEditing?: boolean
}

export function ImageBlock({
    block,
    onUpdate,
    onDelete,
}: ImageBlockProps) {
    const content = block.content as { url?: string; caption?: string }
    const [url, setUrl] = useState(content.url || '')
    const [caption, setCaption] = useState(content.caption || '')
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [tempUrl, setTempUrl] = useState('')

    const handleUrlSubmit = () => {
        if (tempUrl) {
            setUrl(tempUrl)
            onUpdate({ url: tempUrl, caption })
            setShowUrlInput(false)
            setTempUrl('')
        }
    }

    const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCaption = e.target.value
        setCaption(newCaption)
        onUpdate({ url, caption: newCaption })
    }

    const handleRemove = () => {
        setUrl('')
        onUpdate({ url: '', caption: '' })
    }

    // If no image, show placeholder
    if (!url) {
        return (
            <div className="border border-dashed border-border rounded-lg overflow-hidden">
                {showUrlInput ? (
                    <div className="p-4 space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={tempUrl}
                                onChange={(e) => setTempUrl(e.target.value)}
                                placeholder="Paste image URL..."
                                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                            <button
                                onClick={handleUrlSubmit}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                            >
                                Embed
                            </button>
                        </div>
                        <button
                            onClick={() => setShowUrlInput(false)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowUrlInput(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                            >
                                <Link className="h-4 w-4" />
                                Embed link
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Upload coming soon
                        </p>
                    </div>
                )}
            </div>
        )
    }

    // Show image
    return (
        <div className="space-y-2 group relative">
            <div className="relative rounded-lg overflow-hidden">
                <img
                    src={url}
                    alt={caption || 'Image'}
                    className="w-full h-auto max-h-96 object-contain bg-muted/30"
                />
                <button
                    onClick={handleRemove}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <input
                type="text"
                value={caption}
                onChange={handleCaptionChange}
                placeholder="Add a caption..."
                className="w-full text-center text-sm text-muted-foreground bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground/50"
            />
        </div>
    )
}
