'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Folder, MoreVertical, ArrowRight } from 'lucide-react'
import { AreaOfLife, Project } from '@prisma/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AreaCardProps {
    area: AreaOfLife & { projects: Project[] }
    index?: number
}

const colorMap: Record<string, string> = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    yellow: 'bg-yellow-500',
    lime: 'bg-lime-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    sky: 'bg-sky-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    purple: 'bg-purple-500',
    fuchsia: 'bg-fuchsia-500',
    pink: 'bg-pink-500',
    rose: 'bg-rose-500',
    neutral: 'bg-neutral-500',
    slate: 'bg-slate-500',
    gray: 'bg-gray-500',
    zinc: 'bg-zinc-500',
    stone: 'bg-stone-500',
}

const gradientMap: Record<string, string> = {
    red: 'from-red-500/20 to-red-500/5',
    orange: 'from-orange-500/20 to-orange-500/5',
    blue: 'from-blue-500/20 to-blue-500/5',
    green: 'from-green-500/20 to-green-500/5',
    purple: 'from-purple-500/20 to-purple-500/5',
    neutral: 'from-neutral-500/20 to-neutral-500/5',
    // Fallback for others
    default: 'from-primary/20 to-primary/5'
}

export function AreaCard({ area, index = 0 }: AreaCardProps) {
    const bgColorClass = colorMap[area.color || 'neutral'] || 'bg-neutral-500'
    const gradientClass = gradientMap[area.color || 'neutral'] || gradientMap.default

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
        >
            <Card className="h-full border-0 bg-white/5 backdrop-blur-md shadow-lg hover:shadow-xl transition-all relative overflow-hidden group">
                <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-lg font-medium flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${bgColorClass} shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
                        <span className="group-hover:text-primary transition-colors">{area.name}</span>
                    </CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Area</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">Delete Area</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>

                <CardContent className="relative z-10">
                    <div className="space-y-4 mt-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{area.projects.length} Projects</span>
                            <Link href={`/areas/${area.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center hover:text-primary">
                                View Details <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                        </div>

                        {area.projects.length === 0 ? (
                            <div className="h-20 flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-black/5">
                                <p className="text-xs text-muted-foreground italic">No projects yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {area.projects.slice(0, 3).map(project => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="flex items-center gap-3 p-2 rounded-md hover:bg-white/10 transition-colors group/item"
                                    >
                                        <div className="p-1.5 rounded-md bg-background/50 group-hover/item:bg-background transition-colors">
                                            <Folder className="h-3.5 w-3.5 text-muted-foreground group-hover/item:text-primary" />
                                        </div>
                                        <span className="text-sm truncate flex-1">{project.name}</span>
                                    </Link>
                                ))}
                                {area.projects.length > 3 && (
                                    <p className="text-xs text-muted-foreground pl-2 pt-1">
                                        + {area.projects.length - 3} more projects
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
