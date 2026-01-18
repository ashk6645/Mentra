'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Check, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
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
import { Textarea } from '@/components/ui/textarea'
import { createProject } from '@/lib/actions/projects'
import { getAreas } from '@/lib/actions/areas'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { AreaOfLife } from '@prisma/client'
import { PROJECT_TEMPLATES, ProjectTemplate } from '@/lib/project-templates'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    color: z.string().optional(),
    areaId: z.string().optional(),
    templateId: z.string().optional(),
})

const colors = [
    { name: 'Neutral', value: 'neutral' },
    { name: 'Red', value: 'red' },
    { name: 'Blue', value: 'blue' },
    { name: 'Green', value: 'green' },
    { name: 'Purple', value: 'purple' },
    { name: 'Orange', value: 'orange' },
]

interface CreateProjectDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CreateProjectDialog({ open: externalOpen, onOpenChange: externalOnOpenChange }: CreateProjectDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [step, setStep] = useState<'template' | 'details'>('template')
    const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
    const [areas, setAreas] = useState<AreaOfLife[]>([])
    const router = useRouter()

    const open = externalOpen !== undefined ? externalOpen : internalOpen
    const setOpen = externalOnOpenChange || setInternalOpen

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            color: 'neutral',
            areaId: 'none',
            templateId: 'blank',
        },
    })

    useEffect(() => {
        if (open) {
            getAreas().then(setAreas)
        }
    }, [open])

    useEffect(() => {
        if (selectedTemplate) {
            form.setValue('color', selectedTemplate.color)
            form.setValue('templateId', selectedTemplate.id)
        }
    }, [selectedTemplate, form])

    const isLoading = form.formState.isSubmitting

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const result = await createProject({
            ...values,
            areaId: values.areaId === 'none' ? undefined : values.areaId,
            sections: selectedTemplate?.sections || [],
            starterTasks: selectedTemplate?.starterTasks || [],
        })

        if (result.success) {
            setOpen(false)
            setStep('template')
            setSelectedTemplate(null)
            form.reset({
                name: '',
                description: '',
                color: 'neutral',
                areaId: 'none',
                templateId: 'blank',
            })
            router.refresh()
        } else {
            console.error(result.error)
        }
    }

    const handleTemplateSelect = (template: ProjectTemplate) => {
        setSelectedTemplate(template)
        setStep('details')
    }

    const handleBack = () => {
        setStep('template')
    }

    return (
        <Dialog open={open} onOpenChange={(o) => {
            setOpen(o)
            if (!o) {
                setStep('template')
                setSelectedTemplate(null)
            }
        }}>
            {externalOpen === undefined && (
                <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-primary">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Project
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[650px] max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {step === 'details' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBack}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div>
                            <DialogTitle>
                                {step === 'template' ? 'Choose a Template' : 'Project Details'}
                            </DialogTitle>
                            <DialogDescription>
                                {step === 'template' 
                                    ? 'Start with a pre-built template or create from scratch' 
                                    : 'Customize your project settings'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {step === 'template' && (
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="grid grid-cols-2 gap-3">
                            {PROJECT_TEMPLATES.map((template) => {
                                const Icon = template.icon
                                return (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateSelect(template)}
                                        className={cn(
                                            "flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:border-primary hover:bg-accent",
                                            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                        )}
                                    >
                                        <div className={cn(
                                            "rounded-lg p-2",
                                            template.color === 'red' && "bg-red-100 text-red-600",
                                            template.color === 'blue' && "bg-blue-100 text-blue-600",
                                            template.color === 'green' && "bg-green-100 text-green-600",
                                            template.color === 'purple' && "bg-purple-100 text-purple-600",
                                            template.color === 'orange' && "bg-orange-100 text-orange-600",
                                            template.color === 'neutral' && "bg-muted text-muted-foreground",
                                        )}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-medium text-sm">{template.name}</h4>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {template.description}
                                            </p>
                                        </div>
                                        {template.sections.length > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <span>{template.sections.length} sections</span>
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}

                {step === 'details' && selectedTemplate && (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Project Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder={`My ${selectedTemplate.name}`} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Add project description..." 
                                                className="resize-none" 
                                                rows={3}
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {selectedTemplate.sections.length > 0 && (
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    <h4 className="text-sm font-medium mb-2">Template includes:</h4>
                                    <div className="space-y-1">
                                        {selectedTemplate.sections.map((section, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Check className="h-3 w-3 text-green-600" />
                                                {section}
                                            </div>
                                        ))}
                                    </div>
                                    {selectedTemplate.starterTasks && selectedTemplate.starterTasks.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            + {selectedTemplate.starterTasks.length} starter tasks
                                        </p>
                                    )}
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="areaId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Area of Life (Optional)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an area" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">No Area</SelectItem>
                                                {areas.map((area) => (
                                                    <SelectItem key={area.id} value={area.id}>
                                                        {area.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a color" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {colors.map((color) => (
                                                    <SelectItem key={color.value} value={color.value}>
                                                        <div className="flex items-center">
                                                            <div className={cn(
                                                                "mr-2 h-3 w-3 rounded-full",
                                                                color.value === 'red' && "bg-red-500",
                                                                color.value === 'blue' && "bg-blue-500",
                                                                color.value === 'green' && "bg-green-500",
                                                                color.value === 'purple' && "bg-purple-500",
                                                                color.value === 'orange' && "bg-orange-500",
                                                                color.value === 'neutral' && "bg-gray-500",
                                                            )} />
                                                            {color.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button variant="outline" type="button" onClick={handleBack}>
                                    Back
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Project
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    )
}
