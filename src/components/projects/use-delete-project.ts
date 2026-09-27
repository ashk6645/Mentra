'use client'

import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteProject } from '@/lib/actions/projects'

/**
 * Permanently delete a project. If you're looking at it, you land on
 * `/projects`; anywhere else, the page stays put.
 *
 * Leaving happens *before* the delete. The router runs a navigation ahead of
 * any server action queued after it, so the delete — and the refresh it
 * triggers — happen on `/projects`. Deleting first would re-render the
 * project's own page for a project that no longer exists: a 404.
 */
export function useDeleteProject() {
    const router = useRouter()
    const pathname = usePathname()

    return async (projectId: string): Promise<boolean> => {
        const page = `/projects/${projectId}`
        const inside = pathname === page || pathname.startsWith(`${page}/`)
        if (inside) router.replace('/projects')

        try {
            const result = await deleteProject(projectId, 'hard')
            if (!result.success) {
                toast.error(result.error || 'Failed to delete project')
                return false
            }
            toast.success('Project deleted')
            if (!inside) router.refresh()
            return true
        } catch {
            toast.error('An unexpected error occurred')
            return false
        }
    }
}
