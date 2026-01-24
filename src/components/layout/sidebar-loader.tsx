import { Sidebar } from '@/components/layout/sidebar'
import { getProjects } from '@/lib/actions/projects'

interface SidebarLoaderProps {
    user: any
}

export async function SidebarLoader({ user }: SidebarLoaderProps) {
    const projects = await getProjects(user.id)

    return <Sidebar user={user} projects={projects} />
}
