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
import { cn } from '@/lib/utils'

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
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl sm:rounded-2xl">
                <div className="px-6 py-6 sm:px-8 sm:py-7">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-semibold tracking-tight">
                            {mode === 'edit' ? 'Edit Project' : 'New Project'}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground/80 text-[15px] pt-1.5">
                            {mode === 'edit' ? 'Update your project details and preferences.' : 'Create a new project to organize your tasks.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[13px] font-semibold text-foreground/70 uppercase tracking-wider">Project Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Marketing Campaign"
                                maxLength={100}
                                autoFocus
                                disabled={isSubmitting}
                                className="h-11 px-4 rounded-xl bg-muted/40 border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-[15px] shadow-sm"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[13px] font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1">
                                Description <span className="text-muted-foreground/60 font-medium normal-case tracking-normal ml-1">(optional)</span>
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is this project about?"
                                rows={2}
                                maxLength={500}
                                disabled={isSubmitting}
                                className="resize-none min-h-[80px] px-4 py-3 rounded-xl bg-muted/40 border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-[15px] shadow-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 pt-2">
                            {/* Icon Picker */}
                            <div className="space-y-3">
                                <Label className="text-[13px] font-semibold text-foreground/70 uppercase tracking-wider">Icon</Label>
                                <div className="grid grid-cols-6 sm:grid-cols-6 md:grid-cols-4 gap-2">
                                    {PROJECT_EMOJIS.slice(0, 16).map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setIcon(emoji)}
                                            className={cn(
                                                "flex items-center justify-center h-10 w-10 text-xl rounded-xl transition-all duration-200",
                                                icon === emoji
                                                    ? "bg-primary/10 text-primary scale-110 shadow-sm ring-2 ring-primary/20 ring-offset-1 ring-offset-background"
                                                    : "hover:bg-muted text-muted-foreground hover:scale-105"
                                            )}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-3">
                                <Label className="text-[13px] font-semibold text-foreground/70 uppercase tracking-wider">Color Theme</Label>
                                <div className="grid grid-cols-4 gap-3">
                                    {PROJECT_COLORS.map((colorOption) => (
                                        <button
                                            key={colorOption.value}
                                            type="button"
                                            onClick={() => setColor(colorOption.value)}
                                            className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 relative mx-auto sm:mx-0",
                                                colorOption.bg,
                                                color === colorOption.value
                                                    ? `ring-4 ring-offset-2 ring-offset-background ${colorOption.ring} scale-110 shadow-md`
                                                    : `${colorOption.hover} hover:scale-110 shadow-sm opacity-80 hover:opacity-100`
                                            )}
                                            title={colorOption.name}
                                        >
                                            {color === colorOption.value && (
                                                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 mt-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <DialogFooter className="pt-6 sm:pt-8 gap-2 sm:gap-0 mt-4">
                            {mode === 'edit' && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleArchive}
                                    disabled={isSubmitting}
                                    className="sm:mr-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl px-4"
                                >
                                    Archive Project
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                                className="rounded-xl border-border/50 hover:bg-muted px-6 h-10"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl font-medium shadow-sm hover:shadow-md transition-all px-6 h-10"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === 'edit' ? 'Save Changes' : 'Create Project'}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
