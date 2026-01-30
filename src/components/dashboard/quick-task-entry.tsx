'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { createTaskFromNaturalLanguage } from '@/lib/actions/ai-actions'
import { cn } from '@/lib/utils'

interface QuickTaskEntryProps {
    userId: string
}

export function QuickTaskEntry({ userId }: QuickTaskEntryProps) {
    const [input, setInput] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isProcessing) return

        setIsProcessing(true)
        try {
            const result = await createTaskFromNaturalLanguage(input, userId)

            if (result.success) {
                toast({
                    title: "✨ Task created",
                    description: `"${result.task.title}" added to your list`,
                })
                setInput('')
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            toast({
                title: "Failed to create task",
                description: "Please try again",
                variant: "destructive"
            })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
        >
            <form onSubmit={handleSubmit} className="relative">
                <div className={cn(
                    "relative rounded-xl border-2 bg-card transition-all duration-300",
                    isFocused
                        ? "border-primary shadow-lg shadow-primary/10"
                        : "border-border hover:border-primary/50"
                )}>
                    <div className="flex items-center gap-3 p-4">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Plus className="h-5 w-5 text-primary" />
                            </div>
                        </div>

                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="What needs to be done? (e.g., 'Finish DSA assignment tomorrow at 7pm high priority')"
                            className="flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                            disabled={isProcessing}
                        />

                        <Button
                            type="submit"
                            disabled={!input.trim() || isProcessing}
                            className="gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Add Task
                                </>
                            )}
                        </Button>
                    </div>

                    <AnimatePresence>
                        {isFocused && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground"
                            >
                                <p className="flex items-center gap-2">
                                    <Sparkles className="h-3 w-3" />
                                    <span>AI will parse your task with due dates, priority, and tags automatically</span>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </form>
        </motion.div>
    )
}
