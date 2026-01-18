'use client'

import { useState, useEffect } from 'react'
import { Tag } from '@prisma/client'
import { Plus, X, Tag as TagIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { getTags, createTag } from '@/lib/actions/tags'

interface TagManagerProps {
    selectedTagIds: string[]
    onToggleTag: (tagId: string) => void
}

export function TagManager({ selectedTagIds, onToggleTag }: TagManagerProps) {
    const [tags, setTags] = useState<Tag[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [newTagName, setNewTagName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        if (isOpen) {
            getTags().then(setTags)
        }
    }, [isOpen])

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTagName.trim()) return

        setIsCreating(true)
        const result = await createTag({ name: newTagName, color: 'blue' }) // Default color
        if (result.success && result.data) {
            setTags([...tags, result.data])
            onToggleTag(result.data.id) // Auto-select new tag
            setNewTagName('')
        }
        setIsCreating(false)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <TagIcon className="mr-2 h-4 w-4" />
                    Tags
                    {selectedTagIds.length > 0 && (
                        <>
                            <span className="mx-2 h-4 w-[1px] bg-primary/20" />
                            <span className="text-xs text-muted-foreground">{selectedTagIds.length}</span>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <div className="p-2">
                    <form onSubmit={handleCreateTag} className="flex gap-1 mb-2">
                        <Input
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="New tag..."
                            className="h-8 text-xs"
                        />
                        <Button type="submit" size="icon" variant="ghost" className="h-8 w-8" disabled={isCreating || !newTagName}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </form>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {tags.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">No tags yet</p>
                        )}
                        {tags.map(tag => {
                            const isSelected = selectedTagIds.includes(tag.id)
                            return (
                                <div
                                    key={tag.id}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent",
                                        isSelected && "bg-accent"
                                    )}
                                    onClick={() => onToggleTag(tag.id)}
                                >
                                    <div className={cn("w-2 h-2 rounded-full", tag.color ? `bg-${tag.color}-500` : "bg-blue-500")} />
                                    <span className="flex-1 truncate">{tag.name}</span>
                                    {isSelected && <CheckIcon className="h-3 w-3" />}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}
