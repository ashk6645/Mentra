import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/user-session'
import { getProjects, getArchivedProjects } from '@/lib/actions/projects'
import { ProjectsIndexClient } from '@/components/projects/projects-index-client'


export default async function ProjectsPage() {
    const user = await getCurrentUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch active and archived in parallel
    const [activeResult, archivedResult] = await Promise.all([
        getProjects(),
        getArchivedProjects(),
    ])

    const activeProjects = activeResult.success && activeResult.data ? activeResult.data : []
    const archivedProjects = archivedResult.success && archivedResult.data ? archivedResult.data : []

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="w-full">
                <div className="max-w-4xl mx-auto px-6 pt-12 pb-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Projects
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {activeProjects.length} active
                                {archivedProjects.length > 0 && ` · ${archivedProjects.length} archived`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-6 pb-12">
                    <ProjectsIndexClient
                        activeProjects={activeProjects}
                        archivedProjects={archivedProjects}
                    />
                </div>
            </div>
        </div>
    )
}
