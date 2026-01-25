'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
// import { createArea } from '@/lib/actions/areas' // Moved down to avoid circular deps or cleaner grouping

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    color: z.string().optional(),
    icon: z.string().optional(),
})

const colors = [
    { name: 'Neutral', value: 'neutral', class: 'bg-neutral-500' },
    { name: 'Red', value: 'red', class: 'bg-red-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
    { name: 'Amber', value: 'amber', class: 'bg-amber-500' },
    { name: 'Yellow', value: 'yellow', class: 'bg-yellow-500' },
    { name: 'Lime', value: 'lime', class: 'bg-lime-500' },
    { name: 'Green', value: 'green', class: 'bg-green-500' },
    { name: 'Emerald', value: 'emerald', class: 'bg-emerald-500' },
    { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
    { name: 'Cyan', value: 'cyan', class: 'bg-cyan-500' },
    { name: 'Sky', value: 'sky', class: 'bg-sky-500' },
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
    { name: 'Violet', value: 'violet', class: 'bg-violet-500' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
    { name: 'Fuchsia', value: 'fuchsia', class: 'bg-fuchsia-500' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
    { name: 'Rose', value: 'rose', class: 'bg-rose-500' },
]

const icons = [
    "Folder", "Briefcase", "Home", "Heart", "Zap", "Star", "Smile", "Coffee",
    "Book", "Music", "Video", "Image", "Smartphone", "Globe", "Map", "Flag"
]

interface CreateAreaDialogProps {
    area?: {
        id: string
        name: string
        color?: string | null
        icon?: string | null
    }
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
}

import { createArea, updateArea } from '@/lib/actions/areas'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export function CreateAreaDialog({ area, open: controlledOpen, onOpenChange: setControlledOpen, trigger }: CreateAreaDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen

    // Explicitly type setOpen to handle boolean values
    const setOpen = (newOpen: boolean) => {
        if (isControlled) {
            setControlledOpen?.(newOpen)
        } else {
            setInternalOpen(newOpen)
        }

        if (!newOpen) {
            form.reset()
        }
    }

    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: area?.name || '',
            color: area?.color || 'neutral',
            icon: area?.icon || 'Folder',
        },
    })

    // Reset form when area prop changes or dialog opens
    useEffect(() => {
        if (open) {
            form.reset({
                name: area?.name || '',
                color: area?.color || 'neutral',
                icon: area?.icon || 'Folder',
            })
        }
    }, [area, open, form])

    const isLoading = form.formState.isSubmitting

    async function onSubmit(values: z.infer<typeof formSchema>) {
        let result
        if (area) {
            result = await updateArea(area.id, values)
        } else {
            result = await createArea(values)
        }

        if (result.success) {
            setOpen(false)
            router.refresh()
        } else {
            console.error(result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    {trigger || (
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Area
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px] bg-background/80 backdrop-blur-xl border-white/10">
                <DialogHeader>
                    <DialogTitle>{area ? 'Edit Area' : 'Create Area of Life'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Work, Personal, Health" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Color</FormLabel>
                                        <Popover modal={true}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {field.value ? (
                                                                <div className={`w-3 h-3 rounded-full ${colors.find(c => c.value === field.value)?.class || 'bg-neutral-500'}`} />
                                                            ) : null}
                                                            {field.value
                                                                ? colors.find(
                                                                    (color) => color.value === field.value
                                                                )?.name
                                                                : "Select color"}
                                                        </div>
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-2 h-[300px] overflow-y-auto">
                                                <div className="grid grid-cols-1 gap-1">
                                                    {colors.map((color) => (
                                                        <div
                                                            key={color.value}
                                                            className={cn(
                                                                "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm",
                                                                field.value === color.value && "bg-accent"
                                                            )}
                                                            onClick={() => {
                                                                form.setValue("color", color.value)
                                                                // close popover implicitly or keep open
                                                            }}
                                                        >
                                                            <div className={`w-3 h-3 rounded-full ${color.class}`} />
                                                            <span>{color.name}</span>
                                                            {field.value === color.value && <Check className="ml-auto h-4 w-4" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Icon field removed as per user request */}
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {area ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
