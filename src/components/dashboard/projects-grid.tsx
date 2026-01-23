'use client'

import { Card, CardContent } from '@/components/ui/card'
import { FolderKanban, CheckSquare, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface Project {
    id: string
    name: string
    color: string | null
    _count: {
        tasks: number
    }
}

interface ProjectsGridProps {
    projects: Project[]
}

export function ProjectsGrid({ projects }: ProjectsGridProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Active Projects</h2>
                <Link href="/projects" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    View all
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.slice(0, 5).map((project) => (
                    <Link key={project.id} href={`/projects`}>
                        <Card className="h-full border-none shadow-sm bg-card hover:bg-accent/5 transition-all hover:scale-[1.02] cursor-pointer group">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg bg-muted/50 group-hover:bg-background transition-colors`}>
                                        <FolderKanban className="h-5 w-5" style={{ color: project.color || 'var(--primary)' }} />
                                    </div>
                                    <Badge variant="secondary" className="bg-muted font-normal">
                                        {project._count.tasks} tasks
                                    </Badge>
                                </div>
                                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{project.name}</h3>
                                <div className="w-full bg-muted/50 h-1 rounded-full overflow-hidden mt-3">
                                    <div className="bg-primary/50 h-full w-1/3 rounded-full" style={{ backgroundColor: project.color || undefined }} />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                <Link href="/projects">
                    <Card className="h-full border-dashed border-2 shadow-none bg-transparent hover:bg-accent/5 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px]">
                        <div className="p-2 rounded-full bg-muted/50 mb-2">
                            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">View All Projects</p>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
