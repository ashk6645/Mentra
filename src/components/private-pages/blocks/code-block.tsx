'use client'

import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Block, BlockType } from '../types'
import { ChevronDown, Copy, Check } from 'lucide-react'

interface CodeBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string) => void
    isEditing?: boolean
}

const LANGUAGES = [
    'javascript', 'typescript', 'python', 'html', 'css', 'json',
    'sql', 'bash', 'markdown', 'yaml', 'go', 'rust', 'java', 'c', 'cpp'
]

export function CodeBlock({
    block,
    onUpdate,
    onDelete,
    onAddBlock,
}: CodeBlockProps) {
    const content = block.content as { code?: string; language?: string }
    const [code, setCode] = useState(content.code || '')
    const [language, setLanguage] = useState(content.language || 'javascript')
    const [showLangPicker, setShowLangPicker] = useState(false)
    const [copied, setCopied] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newCode = e.target.value
        setCode(newCode)
        onUpdate({ code: newCode, language })
    }

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang)
        setShowLangPicker(false)
        onUpdate({ code, language: lang })
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Tab inserts spaces
        if (e.key === 'Tab') {
            e.preventDefault()
            const start = e.currentTarget.selectionStart
            const end = e.currentTarget.selectionEnd
            const newCode = code.substring(0, start) + '  ' + code.substring(end)
            setCode(newCode)
            onUpdate({ code: newCode, language })
            // Set cursor position after the tab
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = start + 2
                    textareaRef.current.selectionEnd = start + 2
                }
            }, 0)
        }

        // Backspace on empty deletes block
        if (e.key === 'Backspace' && code === '') {
            e.preventDefault()
            onDelete()
        }
    }

    return (
        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
                <div className="relative">
                    <button
                        onClick={() => setShowLangPicker(!showLangPicker)}
                        className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {language}
                        <ChevronDown className="h-3 w-3" />
                    </button>

                    {showLangPicker && (
                        <div className="absolute top-full left-0 mt-1 z-10 bg-popover border border-border rounded-md shadow-lg py-1 max-h-48 overflow-y-auto">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => handleLanguageChange(lang)}
                                    className={cn(
                                        "block w-full px-3 py-1 text-xs text-left hover:bg-accent",
                                        lang === language && "bg-accent/50"
                                    )}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleCopy}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Copy code"
                >
                    {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                </button>
            </div>

            {/* Code area */}
            <div className="p-3">
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="// Write your code here..."
                    className="w-full bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:ring-0 min-h-[4rem]"
                    rows={3}
                    spellCheck={false}
                />
            </div>
        </div>
    )
}
