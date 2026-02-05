'use client'

import { useEffect, useState } from 'react'

export function CurrentDateDisplay() {
    const [date, setDate] = useState<Date | null>(null)

    useEffect(() => {
        setDate(new Date())

        // Update display every minute to ensure it stays fresh
        const interval = setInterval(() => {
            setDate(new Date())
        }, 60000)

        return () => clearInterval(interval)
    }, [])

    if (!date) {
        // Render a placeholder or initial server-matched date to avoid layout shift if possible,
        // but for now, we'll return null or a skeleton if needed. 
        // Given it's a text string, a small hydration mismatch is better avoided by not rendering until client.
        // Or we can render a generic "Today" or similar if we want to be safe, but specific date needs client time.
        // Let's rely on the fact that next.js static/server rendering might provide a date, but we want the CLIENT date.
        // To avoid hydration mismatch, we start with null and render on effect.
        return null
    }

    return (
        <span className="flex items-center gap-2 animate-in fade-in duration-300">
            <span>
                {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
        </span>
    )
}
