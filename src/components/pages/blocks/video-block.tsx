'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Block, BlockType } from '../types'
import { PlayCircle, Link, X } from 'lucide-react'

interface VideoBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string) => void
    isEditing?: boolean
}

// Extract video ID from various URL formats
function getVideoEmbedUrl(url: string): { provider: string; embedUrl: string } | null {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) {
        return { provider: 'YouTube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` }
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
        return { provider: 'Vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` }
    }

    return null
}

export function VideoBlock({
    block,
    onUpdate,
    onDelete,
}: VideoBlockProps) {
    const content = block.content as { url?: string; caption?: string }
    const [url, setUrl] = useState(content.url || '')
    const [caption, setCaption] = useState(content.caption || '')
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [tempUrl, setTempUrl] = useState('')
    const [error, setError] = useState('')

    const videoEmbed = url ? getVideoEmbedUrl(url) : null

    const handleUrlSubmit = () => {
        if (tempUrl) {
            const embed = getVideoEmbedUrl(tempUrl)
            if (embed) {
                setUrl(tempUrl)
                onUpdate({ url: tempUrl, caption })
                setShowUrlInput(false)
                setTempUrl('')
                setError('')
            } else {
                setError('Please enter a valid YouTube or Vimeo URL')
            }
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

    // If no video, show placeholder
    if (!url || !videoEmbed) {
        return (
            <div className="border border-dashed border-border rounded-lg overflow-hidden">
                {showUrlInput ? (
                    <div className="p-4 space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={tempUrl}
                                onChange={(e) => {
                                    setTempUrl(e.target.value)
                                    setError('')
                                }}
                                placeholder="Paste YouTube or Vimeo URL..."
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
                        {error && <p className="text-xs text-destructive">{error}</p>}
                        <button
                            onClick={() => setShowUrlInput(false)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <PlayCircle className="h-10 w-10 text-muted-foreground/50" />
                        <button
                            onClick={() => setShowUrlInput(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                            <Link className="h-4 w-4" />
                            Embed YouTube or Vimeo
                        </button>
                    </div>
                )}
            </div>
        )
    }

    // Show video embed
    return (
        <div className="space-y-2 group relative">
            <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
                <iframe
                    src={videoEmbed.embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
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
