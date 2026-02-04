'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSection } from '@/lib/actions/sections'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface AddSectionButtonProps {
    projectId: string
}

export function AddSectionButton({ projectId }: AddSectionButtonProps) {
    const router = useRouter()
    const [isAdding, setIsAdding] = useState(false)
    const [sectionName, setSectionName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!sectionName.trim()) {
            toast.error('Section name cannot be empty')
            return
        }

        setIsSubmitting(true)
        try {
            const result = await createSection(projectId, sectionName.trim())

            if (result.success) {
                toast.success('Section created')
                setSectionName('')
                setIsAdding(false)
                router.refresh()
            } else {
                toast.error('Failed to create section', {
                    description: result.error || 'Please try again',
                })
            }
        } catch (error) {
            toast.error('Failed to create section', {
                description: 'An unexpected error occurred',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancel = () => {
        setSectionName('')
        setIsAdding(false)
    }

    if (isAdding) {
        return (
            <div className="">
                <div className="mb-3">
                    <Input
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit()
                            if (e.key === 'Escape') handleCancel()
                        }}
                        placeholder="Name this section"
                        className="h-10 px-3 py-2 bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium"
                        autoFocus
                        disabled={isSubmitting}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-red-600 hover:bg-red-700 text-white border-transparent h-8 px-4 font-medium"
                    >
                        {isSubmitting ? 'Adding...' : 'Add section'}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="h-8 px-4 text-muted-foreground hover:text-foreground font-medium"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="text-muted-foreground/70 hover:text-foreground"
        >
            <Plus className="h-3.5 w-3.5 mr-2" />
            Add section
        </Button>
    )
}
