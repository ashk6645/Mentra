'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Block, BlockType } from '../types'

interface DividerBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string) => void
    isEditing?: boolean
}

export function DividerBlock({ onDelete }: DividerBlockProps) {
    const [isSelected, setIsSelected] = useState(false)
    const divRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isSelected && (e.key === 'Delete' || e.key === 'Backspace')) {
                e.preventDefault()
                onDelete()
            }
        }

        const handleClickOutside = (e: MouseEvent) => {
            if (divRef.current && !divRef.current.contains(e.target as Node)) {
                setIsSelected(false)
            }
        }

        if (isSelected) {
            document.addEventListener('keydown', handleKeyDown)
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isSelected, onDelete])

    return (
        <div
            ref={divRef}
            className="py-3 group cursor-pointer"
            onClick={() => setIsSelected(true)}
            tabIndex={0}
            role="button"
            aria-label="Divider (click to select, press Delete to remove)"
        >
            <hr className={`border-border transition-colors ${isSelected
                    ? 'border-primary border-2'
                    : 'group-hover:border-muted-foreground/50'
                }`} />
        </div>
    )
}
