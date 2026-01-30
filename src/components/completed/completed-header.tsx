'use client'

import { ClipboardCheck } from 'lucide-react'

export function CompletedHeader() {
    return (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <ClipboardCheck className="h-10 w-10 text-green-600 dark:text-green-500" strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Completed</h1>
            </div>

            <p className="text-base text-muted-foreground/80 font-medium">
                Everything you've accomplished.
            </p>
        </div>
    )
}
