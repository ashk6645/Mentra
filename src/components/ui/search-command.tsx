"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

// Main Command Container
interface SearchCommandProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children?: React.ReactNode
}

export function SearchCommand({ open, onOpenChange, children }: SearchCommandProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden p-0 shadow-lg max-w-2xl">
                <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Search Input
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onValueChange?: (value: string) => void
}

export function SearchInput({ className, onValueChange, ...props }: SearchInputProps) {
    return (
        <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
                className={cn(
                    "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                onChange={(e) => onValueChange?.(e.target.value)}
                autoFocus
                {...props}
            />
        </div>
    )
}

// Results List
interface SearchListProps {
    children?: React.ReactNode
    className?: string
}

export function SearchList({ children, className }: SearchListProps) {
    return (
        <div className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}>
            {children}
        </div>
    )
}

// Empty State
interface SearchEmptyProps {
    children?: React.ReactNode
}

export function SearchEmpty({ children }: SearchEmptyProps) {
    return (
        <div className="py-6 text-center text-sm">
            {children}
        </div>
    )
}

// Group
interface SearchGroupProps {
    heading?: string
    children?: React.ReactNode
    className?: string
}

export function SearchGroup({ heading, children, className }: SearchGroupProps) {
    return (
        <div className={cn("overflow-hidden p-1 text-foreground", className)}>
            {heading && (
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {heading}
                </div>
            )}
            {children}
        </div>
    )
}

// Separator
export function SearchSeparator({ className }: { className?: string }) {
    return <div className={cn("-mx-1 h-px bg-border", className)} />
}

// Item
interface SearchItemProps {
    children?: React.ReactNode
    onSelect?: () => void
    className?: string
    selected?: boolean
}

export const SearchItem = React.forwardRef<HTMLDivElement, SearchItemProps>(
    ({ children, onSelect, className, selected }, ref) => {
        const handleClick = (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            onSelect?.()
        }

        const handleMouseDown = (e: React.MouseEvent) => {
            e.preventDefault()
            onSelect?.()
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selected && "bg-accent text-accent-foreground",
                    className
                )}
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                role="option"
                aria-selected={selected}
            >
                {children}
            </div>
        )
    }
)

SearchItem.displayName = "SearchItem"

// Shortcut
export function SearchShortcut({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn(
                "ml-auto text-xs tracking-widest text-muted-foreground",
                className
            )}
            {...props}
        />
    )
}
