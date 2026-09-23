import { Overview, type ServerSnapshot } from '@/components/second-brain/overview'
import { SecondBrainPage } from '@/components/second-brain/page-shell'
import { getSidebarCounts } from '@/lib/actions/tasks'

/*
 * Reads the signed-in user's task counts, so it can never be prerendered — the
 * same convention /calendar, /upcoming and /completed use.
 */
export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Second Brain – Mentra',
    description: 'Today at a glance: habits, routines and goals.',
}

/**
 * A server component so the task counts come from Mentra's real database rather
 * than being re-implemented against localStorage. Habits, routines and goals live
 * in the local store; tasks live where they always have. Two sources, one screen.
 */
export default async function SecondBrainOverviewPage() {
    // User-scoped and fail-closed: a request without a session renders zeroes.
    const counts = await getSidebarCounts()

    const server: ServerSnapshot = {
        todayTaskCount: counts.data?.today ?? 0,
        overdueCount: counts.data?.overdue ?? 0,
    }

    return (
        <SecondBrainPage>
            <Overview server={server} />
        </SecondBrainPage>
    )
}
