'use client'

import { Project } from '@prisma/client'
import { ProjectCard } from './project-card'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface ProjectWithStats extends Project {
    progress: number
    totalTasks: number
    completedTasks: number
}

interface ProjectBoardProps {
    projects: ProjectWithStats[]
}

const COLUMNS = [
    { id: 'PLANNING', label: 'Not started', color: 'bg-gray-200 dark:bg-gray-800', dot: 'bg-gray-400' },
    { id: 'ACTIVE', label: 'In progress', color: 'bg-blue-100 dark:bg-blue-900/30', dot: 'bg-blue-500' },
    { id: 'COMPLETED', label: 'Done', color: 'bg-green-100 dark:bg-green-900/30', dot: 'bg-green-500' },
]

export function ProjectBoard({ projects }: ProjectBoardProps) {

    // Group projects
    const groupedProjects = COLUMNS.reduce((acc, col) => {
        acc[col.id] = projects.filter(p => p.status === col.id)
        return acc
    }, {} as Record<string, ProjectWithStats[]>)

    // Add ON_HOLD to PLANNING or separate? Let's ignore or put in PLANNING for now 
    // unless we add a column.

    return (
        <div className="flex-1 h-full overflow-hidden">
            <ScrollArea className="h-full w-full whitespace-nowrap">
                <div className="flex gap-6 p-6 h-full min-w-full">
                    {COLUMNS.map(col => (
                        <div key={col.id} className="w-80 shrink-0 flex flex-col gap-4 h-full">
                            {/* Column Header */}
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="px-2 py-0.5 font-normal text-sm gap-1.5 h-6">
                                        <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                                        {col.label}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground ml-1">
                                        {groupedProjects[col.id]?.length || 0}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Cards Container */}
                            <div className="flex flex-col gap-3 pb-4">
                                {groupedProjects[col.id]?.map(project => (
                                    <ProjectCard key={project.id} project={project} />
                                ))}

                                <Button variant="ghost" className="justify-start text-muted-foreground font-normal pl-2 hover:bg-muted/50">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New project
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}
