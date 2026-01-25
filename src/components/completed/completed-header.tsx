'use client'

import { CheckCircle2 } from 'lucide-react'

export function CompletedHeader() {
    return (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <h1 className="text-3xl font-bold text-foreground">Completed</h1>
            </div>

            <div className="h-px w-24 bg-border/50 my-2" />

            <p className="text-sm text-muted-foreground">
                Review your progress and accomplishments
            </p>
        </div>
    )
}
