import React, { useRef, useEffect } from 'react'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import { Block } from '../types'
import { cn } from '@/lib/utils'

interface ParagraphBlockProps {
    block: Block
    content: any
    onChange: (content: any) => void
    onKeyDown: (e: React.KeyboardEvent) => void
    onFocus: () => void
    onBlur: (id: string) => void
    cursorOffset?: number | null // Optional cursor position to set on focus
    readOnly?: boolean
}

export const ParagraphBlock = React.forwardRef<HTMLElement, ParagraphBlockProps>(
    ({ block, content, onChange, onKeyDown, onFocus, onBlur, cursorOffset, readOnly }, ref) => {
        const text = content.text || ''

        // Use a local ref if one isn't provided, to manage focus
        const innerRef = useRef<HTMLElement>(null)

        // Combine refs (simple merge for now, assuming ref is function or object)
        React.useImperativeHandle(ref, () => innerRef.current!)

        const handleChange = (e: ContentEditableEvent) => {
            if (readOnly) {
                return
            }
            onChange({ ...content, text: e.target.value })
        }

        // Handle custom cursor positioning on focus
        useEffect(() => {
            if (cursorOffset !== undefined && cursorOffset !== null && innerRef.current) {
                const el = innerRef.current;
                const range = document.createRange();
                const sel = window.getSelection();

                // We need to find the text node. ContentEditable might have children.
                // Usually for simple text it's the first child.
                // If text is empty, we just focus (cursor at start).
                if (!text && cursorOffset === 0) {
                    el.focus();
                    return;
                }

                // Helper to find text node at index (simplified for contentEditable flat text)
                // We assume flat text for now (no bold/italic nested nodes yet).
                // If nested, we need more complex logic. Given "Basic Block", flat text is fair assumption.

                if (el.childNodes.length > 0) {
                    // Try to find text node
                    let found = false;
                    // Naive: assume first child is the text node
                    const textNode = el.firstChild;
                    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                        const len = (textNode.textContent || '').length;
                        const safeOffset = Math.min(len, cursorOffset);
                        try {
                            range.setStart(textNode, safeOffset);
                            range.collapse(true);
                            sel?.removeAllRanges();
                            sel?.addRange(range);
                            found = true;
                        } catch (e) {
                            console.warn("Retrying cursor set", e)
                        }
                    }
                } else {
                    // Maybe it's empty but user wants to focus?
                    el.focus();
                }
            }
        }, [cursorOffset, text]) // Re-run if cursor request changes or text finishes updating? 
        // Ideally we only run when `cursorOffset` is SET to a new value (trigger).
        // A timestamp/ID might be better, OR we trust `focusBlockId` change triggers re-render with new prop.

        return (
            <ContentEditable
                innerRef={innerRef}
                html={text}
                disabled={readOnly || false}
                onChange={handleChange}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                onBlur={() => onBlur(block.id)} // Fixed sig
                className={cn(
                    "min-h-[1.5em] outline-none break-words whitespace-pre-wrap py-1",
                    !text && "empty:before:content-['Type,_press_/_for_commands'] empty:before:text-muted-foreground/50 empty:before:pointer-events-none"
                )}
                tagName="div"
            />
        )
    }
)

ParagraphBlock.displayName = 'ParagraphBlock'
