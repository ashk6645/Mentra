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
            <div className="flex items-center gap-2 py-2 px-1">
                <Input
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmit()
                        if (e.key === 'Escape') handleCancel()
                    }}
                    placeholder="Section name..."
                    className="h-8 text-sm"
                    autoFocus
                    disabled={isSubmitting}
                />
                <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="h-8"
                >
                    {isSubmitting ? 'Adding...' : 'Add'}
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="h-8"
                >
                    Cancel
                </Button>
            </div>
        )
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="w-full justify-start text-muted-foreground hover:text-foreground h-8"
        >
            <Plus className="mr-2 h-4 w-4" />
            Add Section
        </Button>
    )
}
