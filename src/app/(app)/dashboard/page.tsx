import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardWidgets } from '@/components/dashboard/dashboard-widgets'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Suspense } from 'react'

export default async function DashboardPage() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return <div className="p-8">Please log in to view dashboard</div>
        }

        // Fetch user profile for display name (Fast query for LCP)
        const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: { displayName: true }
        })

        const displayName = profile?.displayName || user?.user_metadata?.display_name || 'User'

        return (
            <div className="flex-1 p-6 md:p-8 pt-6 max-w-[1600px] mx-auto space-y-8">
                <DashboardHeader displayName={displayName} />

                <Suspense fallback={<DashboardSkeleton />}>
                    <DashboardWidgets userId={user.id} />
                </Suspense>
            </div>
        )
    } catch (error) {
        console.error('Dashboard Error:', error)
        return <div className="p-8 text-center text-muted-foreground">Unable to load dashboard. Please try refreshing.</div>
    }
}
