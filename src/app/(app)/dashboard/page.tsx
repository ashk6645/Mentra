import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return <div className="p-8">Please log in to view dashboard</div>
        }

        // Fetch user profile with all gamification data
        const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: {
                displayName: true,
                level: true,
                totalXp: true,
                currentStreak: true,
                longestStreak: true,
            }
        })

        const displayName = profile?.displayName || user?.user_metadata?.display_name || 'User'

        return (
            <div className="flex-1 p-4 md:p-6 lg:p-8 pt-6 max-w-[1800px] mx-auto w-full">
                <DashboardHeader
                    displayName={displayName}
                    level={profile?.level || 1}
                    currentXP={profile?.totalXp || 0}
                    streak={profile?.currentStreak || 0}
                />

                <Suspense fallback={<DashboardSkeleton />}>
                    <DashboardContent
                        userId={user.id}
                        profile={profile}
                    />
                </Suspense>
            </div>
        )
    } catch (error) {
        console.error('Dashboard Error:', error)
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <p className="text-muted-foreground">Unable to load dashboard</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-primary hover:underline"
                    >
                        Try refreshing
                    </button>
                </div>
            </div>
        )
    }
}
