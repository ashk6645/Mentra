import { getProjects } from '@/lib/actions/projects'
import Link from 'next/link'
import { Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'

export async function ProjectList() {
    const projects = await getProjects()

    return (
        <div className="space-y-1">
            {projects.map((project) => (
                <Button
                    key={project.id}
                    variant="ghost"
                    className="w-full justify-start font-normal"
                    asChild
                >
                    <Link href={`/projects/${project.id}`}>
                        <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{project.name}</span>
                    </Link>
                </Button>
            ))}
        </div>
    )
}
