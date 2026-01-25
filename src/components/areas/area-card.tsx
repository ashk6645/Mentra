'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Folder, MoreVertical, ArrowRight, Trash2, Edit2 } from 'lucide-react'
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
import { deleteArea } from '@/lib/actions/areas'
import { useRouter } from 'next/navigation'
import { CreateAreaDialog } from './create-area-dialog'
import { useState } from 'react'

interface AreaStats {
    name: string
    color: string
    taskCount: number
    completedCount: number
    percentage: number
}

interface AreaCardProps {
    area: AreaOfLife & { projects: Project[] }
    stats?: AreaStats
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

export function AreaCard({ area, stats, index = 0 }: AreaCardProps) {
    const bgColorClass = colorMap[area.color || 'neutral'] || 'bg-neutral-500'
    const router = useRouter()
    const [isEditOpen, setIsEditOpen] = useState(false)

    // Default stats if missing
    const completeness = stats?.percentage || 0
    const taskCount = stats?.taskCount || 0

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this area? This cannot be undone.')) {
            await deleteArea(area.id)
            router.refresh()
        }
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
        >
            <div className="h-full relative group">
                <Link href={`/areas/${area.id}`} className="block h-full">
                    <Card className="h-full border-0 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 overflow-hidden relative cursor-pointer ring-1 ring-white/10 hover:ring-primary/50 hover:shadow-lg hover:-translate-y-0.5">
                        {/* Top Color Accent Line */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${bgColorClass} opacity-80`} />

                        <CardContent className="p-5 flex flex-col h-full justify-between">
                            {/* Header: Icon + Name */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${bgColorClass} bg-opacity-20 flex items-center justify-center text-foreground group-hover:scale-110 transition-transform`}>
                                        <Folder className="w-5 h-5 opacity-80" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">
                                            {area.name}
                                        </h3>
                                        <span className="text-xs text-muted-foreground mt-0.5">
                                            {area.projects.length} Projects
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer: Progress & Stats */}
                            <div className="mt-2 space-y-3">
                                <div className="flex justify-between items-end text-xs">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-bold">{completeness}%</span>
                                </div>

                                <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${bgColorClass}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completeness}%` }}
                                        transition={{ duration: 1, delay: 0.2 }}
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                                    <span>{taskCount} Tasks total</span>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Absoluted Actions - outside the Link but inside the relative container */}
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white/10 text-muted-foreground hover:text-white"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsEditOpen(true)
                        }}
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDelete()
                        }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <CreateAreaDialog
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    area={area}
                    trigger={<span className="hidden" />} // Hidden trigger since we control open state
                />
            </div>
        </motion.div>
    )
}