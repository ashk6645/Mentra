'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createProject, updateProject, type Project } from '@/lib/actions/projects'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const PROJECT_COLORS = [
    { name: 'Red', value: 'red', bg: 'bg-red-500', hover: 'hover:bg-red-600', ring: 'ring-red-500' },
    { name: 'Orange', value: 'orange', bg: 'bg-orange-500', hover: 'hover:bg-orange-600', ring: 'ring-orange-500' },
    { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', ring: 'ring-yellow-500' },
    { name: 'Green', value: 'green', bg: 'bg-green-500', hover: 'hover:bg-green-600', ring: 'ring-green-500' },
    { name: 'Blue', value: 'blue', bg: 'bg-blue-500', hover: 'hover:bg-blue-600', ring: 'ring-blue-500' },
    { name: 'Purple', value: 'purple', bg: 'bg-purple-500', hover: 'hover:bg-purple-600', ring: 'ring-purple-500' },
    { name: 'Pink', value: 'pink', bg: 'bg-pink-500', hover: 'hover:bg-pink-600', ring: 'ring-pink-500' },
    { name: 'Gray', value: 'gray', bg: 'bg-gray-500', hover: 'hover:bg-gray-600', ring: 'ring-gray-500' },
]

const PROJECT_EMOJIS = [
    '📁', '💼', '🏠', '🎯', '🚀', '💡', '📚', '🎨',
    '⚙️', '🔧', '🌟', '📊', '🎵', '🏋️', '🍳', '🌿'
]

interface CreateProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode?: 'create' | 'edit'
    project?: Project
    onSuccess?: (project: Project) => void
}

export function CreateProjectDialog({
    open,
    onOpenChange,
    mode = 'create',
    project,
    onSuccess,
}: CreateProjectDialogProps) {
    const [name, setName] = useState(project?.name || '')
    const [icon, setIcon] = useState(project?.icon || '📁')
    const [color, setColor] = useState(project?.color || 'blue')
    const [description, setDescription] = useState(project?.description || '')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (!name.trim()) {
            setError('Project name is required')
            return
        }

        if (name.length > 100) {
            setError('Name must be 100 characters or less')
            return
        }

        setIsSubmitting(true)

        try {
            let result

            if (mode === 'edit' && project) {
                result = await updateProject(project.id, {
                    name: name.trim(),
                    icon,
                    color,
                    description: description.trim() || undefined,
                })
            } else {
                result = await createProject({
                    name: name.trim(),
                    icon,
                    color,
                    description: description.trim() || undefined,
                })
            }

            if (result.success && result.data) {
                toast.success(mode === 'edit' ? 'Project updated' : 'Project created')
                onSuccess?.(result.data)
                onOpenChange(false)

                // Reset form
                if (mode === 'create') {
                    setName('')
                    setIcon('📁')
                    setColor('blue')
                    setDescription('')
                }
            } else {
                setError(result.error || 'Failed to save project')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleArchive = async () => {
        if (!project) return

        setIsSubmitting(true)
        try {
            const result = await updateProject(project.id, { isArchived: true })

            if (result.success) {
                toast.success('Project archived')
                onOpenChange(false)
            } else {
                setError(result.error || 'Failed to archive project')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'Edit Project' : 'New Project'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'edit' ? 'Update your project details' : 'Create a new project to organize your tasks'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Icon Picker */}
                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <div className="grid grid-cols-8 gap-2">
                            {PROJECT_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setIcon(emoji)}
                                    className={`
                    flex items-center justify-center h-10 w-10 rounded-md text-xl
                    transition-all duration-200
                    ${icon === emoji
                                            ? 'bg-accent ring-2 ring-primary ring-offset-2'
                                            : 'hover:bg-accent/50'
                                        }
                  `}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Work"
                            maxLength={100}
                            autoFocus
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                            {name.length}/100 characters
                        </p>
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                            {PROJECT_COLORS.map((colorOption) => (
                                <button
                                    key={colorOption.value}
                                    type="button"
                                    onClick={() => setColor(colorOption.value)}
                                    className={`
                    h-8 w-8 rounded-full ${colorOption.bg}
                    transition-all duration-200
                    ${color === colorOption.value
                                            ? `ring-2 ring-offset-2 ${colorOption.ring}`
                                            : `${colorOption.hover} hover:scale-110`
                                        }
                  `}
                                    title={colorOption.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="All work-related tasks"
                            rows={3}
                            maxLength={500}
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                            {description.length}/500 characters
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        {mode === 'edit' && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleArchive}
                                disabled={isSubmitting}
                                className="sm:mr-auto"
                            >
                                Archive
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'edit' ? 'Save Changes' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
