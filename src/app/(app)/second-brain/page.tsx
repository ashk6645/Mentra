import { CommandCenter, type ServerSnapshot } from '@/components/second-brain/command-center'
import { SecondBrainPage } from '@/components/second-brain/page-shell'
import { getSidebarCounts } from '@/lib/actions/tasks'
import { getProjects } from '@/lib/actions/projects'

/*
 * Reads the signed-in user's tasks and projects, so it can never be prerendered.
 * Declaring it here matches the convention already used by /calendar, /upcoming
 * and /completed, and stops the build attempting a static pass that fails on
 * `cookies()` and logs a caught error for every request.
 */
export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Second Brain – Mentra',
    description: 'Your command center — habits, routines, goals and today at a glance.',
}

/**
 * Second Brain command center.
 *
 * A server component so the task counts and project list come from Mentra's real
 * database rather than being re-implemented against localStorage. That split is
 * the point of the feature: habits, routines and goals live in the local store
 * (they have no backend yet), while tasks and projects are read from the ones
 * that already exist. Two sources, one screen — which is what makes this a hub
 * rather than another isolated dashboard.
 */
export default async function SecondBrainHomePage() {
    // Both are already user-scoped and fail closed, so a logged-out request that
    // somehow reached here renders zeroes rather than another user's data.
    const [counts, projects] = await Promise.all([getSidebarCounts(), getProjects()])

    const server: ServerSnapshot = {
        todayTaskCount: counts.data?.today ?? 0,
        overdueCount: counts.data?.overdue ?? 0,
        activeProjects:
            projects.success && projects.data
                ? projects.data.map(project => ({
                    id: project.id,
                    name: project.name,
                    color: project.color ?? null,
                }))
                : [],
    }

    return (
        <SecondBrainPage>
            <CommandCenter server={server} />
        </SecondBrainPage>
    )
}
