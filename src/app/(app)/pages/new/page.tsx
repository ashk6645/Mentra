'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPage } from '@/lib/actions/pages'

export default function NewPrivatePage() {
    const router = useRouter()

    const isCreating = useRef(false)

    useEffect(() => {
        if (isCreating.current) return
        isCreating.current = true

        const init = async () => {
            try {
                const result = await createPage({ title: 'Untitled' })
                if (result.success && result.page) {
                    router.replace(`/pages/${result.page.id}`)
                    router.refresh()
                } else {
                    router.replace('/dashboard')
                }
            } catch (error) {
                console.error('Failed to create page', error)
                router.replace('/dashboard')
            }
        }
        init()
    }, [router])

    return (
        <div className="flex h-full items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-2 text-muted-foreground">
                <div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span className="text-sm">Creating page...</span>
            </div>
        </div>
    )
}
