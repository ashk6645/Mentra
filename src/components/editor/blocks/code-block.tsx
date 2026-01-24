import React, { useRef } from 'react'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import { Block } from '../types'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
    block: Block
    content: any
    onChange: (content: any) => void
    onKeyDown: (e: React.KeyboardEvent) => void
    onFocus: () => void
    onBlur: () => void
}

export const CodeBlock = React.forwardRef<HTMLElement, CodeBlockProps>(
    ({ block, content, onChange, onKeyDown, onFocus, onBlur }, ref) => {
        const text = content.text || ''
        const language = content.language || 'typescript'
        const innerRef = useRef<HTMLElement>(null)
        React.useImperativeHandle(ref, () => innerRef.current!)

        const handleChange = (e: ContentEditableEvent) => {
            onChange({ ...content, text: e.target.value })
        }

        const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            onChange({ ...content, language: e.target.value })
        }

        // Intercept Enter key to allow new lines inside code block without creating new block
        const handleLocalKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                // In text blocks, Enter creates new block. 
                // In code block, we want new line.
                // But usually Notion allows new line with Shift+Enter everywhere, 
                // and Enter creates new block.
                // However, for code blocks, users expect Enter to be a newline.
                // We can use Shift+Enter to break out?
                // Or standard behavior: Enter = newline, Shift+Enter = newline.
                // To exit code block: 2 Enters? Or using arrow keys.
                // Let's stick to standard internal newline for now, but we need to stop propagation
                // if we want to mimic standard code editors.
                // Current parent BlockBinder handles Enter to create new block.
                // We need to STOP that if we want internal newlines.

                // BUT, preserving standard behavior: Enter -> New Block is consistent.
                // Users use Shift+Enter for newline.
                // Let's stick to consistent behavior for MVP unless requested.
            }
            onKeyDown(e)
        }

        return (
            <div className="relative group rounded-md overflow-hidden border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 my-2">
                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                    <span className="text-xs text-gray-500 font-medium">Code</span>
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="bg-transparent text-xs text-gray-500 outline-none cursor-pointer hover:text-gray-800 dark:hover:text-gray-200"
                    >
                        <option value="typescript">TypeScript</option>
                        <option value="javascript">JavaScript</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="python">Python</option>
                        <option value="json">JSON</option>
                        <option value="bash">Bash</option>
                    </select>
                </div>
                <div className="p-3 font-mono text-sm overflow-x-auto">
                    <ContentEditable
                        innerRef={innerRef}
                        html={text}
                        disabled={false}
                        onChange={handleChange}
                        onKeyDown={handleLocalKeyDown}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        className="outline-none min-h-[1.5em] whitespace-pre-wrap"
                        tagName="pre"
                    />
                </div>
            </div>
        )
    }
)

CodeBlock.displayName = 'CodeBlock'
