'use client'

import { Project } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Calendar, Folder, User2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

interface ProjectCardProps {
    project: Project & {
        progress: number
        totalTasks: number
        completedTasks: number
    }
}

export function ProjectCard({ project }: ProjectCardProps) {
    const router = useRouter()

    return (
        <div
            onClick={() => router.push(`/projects/${project.id}`)}
            className="group bg-card hover:bg-muted/40 border border-border/50 hover:border-border/80 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "mt-1 h-8 w-8 rounded flex items-center justify-center text-lg",
                        project.icon ? "bg-transparent" : "bg-primary/10"
                    )}>
                        {project.icon || <Folder className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                            {project.name}
                        </h3>
                        {project.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {project.description}
                            </p>
                        )}
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{project.progress}%</span>
                    <span>{project.completedTasks}/{project.totalTasks}</span>
                </div>
                <Progress value={project.progress} className="h-1.5" />
            </div>

            <div className="flex items-center gap-2 pt-2">
                <Badge variant="outline" className={cn(
                    "text-[10px] px-1.5 h-5 font-medium border-0",
                    project.priority === 'HIGH' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    project.priority === 'MEDIUM' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                    project.priority === 'LOW' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                )}>
                    {project.priority || 'Medium'}
                </Badge>

                {project.targetDate && (
                    <div className="flex items-center text-[10px] text-muted-foreground ml-auto bg-muted/50 px-1.5 py-0.5 rounded">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(project.targetDate), 'MMM d')}
                    </div>
                )}
            </div>
        </div>
    )
}
