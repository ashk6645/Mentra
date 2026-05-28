'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { ThemeProvider } from 'next-themes'
import { makeQueryClient } from './react-query'

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => makeQueryClient())
    const pathname = usePathname()
    const isThemeLocked = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/signin')

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem={!isThemeLocked}
                forcedTheme={isThemeLocked ? 'light' : undefined}
                disableTransitionOnChange={false}
                themes={[
                    'light',
                    'dark',
                    'amoled',
                    'solarized',
                    'rose',
                    'midnight',
                    'nord',
                    'forest',
                    'paper',
                    'cyberpunk',
                    'ocean',
                    'sunset',
                    'lavender',
                    'mint',
                    'charcoal'
                ]}
            >
                {children}
            </ThemeProvider>
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    )
}
