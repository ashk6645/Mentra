'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { isTomorrow } from 'date-fns'

export function MidnightRefresher() {
    const router = useRouter()
    // Tracking the "today" that the component was mounted on
    const mountedDateRef = useRef(new Date())

    useEffect(() => {
        // Check every minute
        const intervalId = setInterval(() => {
            const now = new Date()

            // If the current time is "tomorrow" relative to when we mounted (or last refreshed),
            // it means we've crossed midnight.
            if (isTomorrow(mountedDateRef.current)) {
                // Update the ref so we don't spam refresh
                mountedDateRef.current = now

                // Refresh the server components to fetch new data
                router.refresh()
            }
        }, 60 * 1000)

        return () => clearInterval(intervalId)
    }, [router])

    return null
}
