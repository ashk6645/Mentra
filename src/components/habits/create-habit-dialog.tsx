'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { createHabit } from '@/lib/actions/habits'
import { useRouter } from 'next/navigation'

export function CreateHabitDialog() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY')
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
            setFrequency('DAILY')
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Habit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Habit</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Habit Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Exercise, Read, Meditate"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Frequency</label>
                        <Select value={frequency} onValueChange={(v: 'DAILY' | 'WEEKLY' | 'MONTHLY') => setFrequency(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DAILY">Daily</SelectItem>
                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || !name.trim()}>
                        {isLoading ? 'Creating...' : 'Create Habit'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
