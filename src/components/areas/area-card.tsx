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

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4 relative z-10">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 truncate pr-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${bgColorClass} shadow-[0_0_8px_rgba(0,0,0,0.2)] flex-shrink-0`} />
                        <span className="truncate group-hover:text-primary transition-colors">{area.name}</span>
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                            {area.projects.length}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit Area</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive">Delete Area</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 pt-0 relative z-10">
                    <div className="mt-3">
                        {area.projects.length === 0 ? (
                            <div className="h-12 flex items-center justify-center border border-dashed border-white/10 rounded-md bg-black/5">
                                <p className="text-[10px] text-muted-foreground italic">No projects</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {area.projects.slice(0, 3).map(project => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white/10 transition-colors group/item"
                                    >
                                        <div className="p-1 rounded bg-background/50 group-hover/item:bg-background transition-colors">
                                            <Folder className="h-3 w-3 text-muted-foreground group-hover/item:text-primary" />
                                        </div>
                                        <span className="text-xs truncate flex-1 text-muted-foreground group-hover/item:text-foreground transition-colors">
                                            {project.name}
                                        </span>
                                    </Link>
                                ))}
                                {(area.projects.length > 3) && (
                                    <Link href={`/areas/${area.id}`} className="block text-[10px] text-center text-muted-foreground hover:text-primary mt-1 transition-colors">
                                        + {area.projects.length - 3} more...
                                    </Link>
                                )}
                            </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                            <Link href={`/areas/${area.id}`} className="text-xs flex items-center text-muted-foreground hover:text-primary transition-colors">
                                Open Area <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
