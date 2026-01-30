'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { createHabit } from '@/lib/actions/habits'
import { useRouter } from 'next/navigation'

export function CreateHabitDialog({ children }: { children?: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsLoading(true)
        const result = await createHabit({ name, frequency })
        setIsLoading(false)

        if (result.success) {
            setName('')
            setFrequency('daily')
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Habit
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold">Create New Habit</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">What do you want to achieve?</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Read 30 mins, Gym, Meditate"
                            className="rounded-xl border-neutral-200 dark:border-neutral-800 focus:ring-2 focus:ring-primary/20 bg-neutral-50 dark:bg-neutral-900"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">How often?</label>
                        <Select value={frequency} onValueChange={(v: 'daily' | 'weekly' | 'monthly') => setFrequency(v)}>
                            <SelectTrigger className="rounded-xl border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        type="submit"
                        className="w-full rounded-xl h-12 text-base font-medium"
                        disabled={isLoading || !name.trim()}
                    >
                        {isLoading ? 'Creating...' : 'Create Habit'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
