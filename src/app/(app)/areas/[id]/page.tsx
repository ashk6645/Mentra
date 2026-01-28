import { getArea } from '@/lib/actions/areas'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Folder, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'

interface AreaPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function AreaPage({ params }: AreaPageProps) {
    const { id } = await params
    const area = await getArea(id)

    if (!area) {
        notFound()
    }

    const colorClasses: Record<string, string> = {
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

    const bgColorClass = colorClasses[area.color || 'neutral'] || 'bg-neutral-500'

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-background to-background/50">
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
                        <Link href="/areas">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Areas
                        </Link>
                    </Button>
                </div>

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${bgColorClass} flex items-center justify-center text-white shadow-lg`}>
                            <Folder className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{area.name}</h1>
                            <p className="text-muted-foreground text-lg">
                                {area.projects.length} Projects
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {area.projects.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                            <p className="text-muted-foreground mb-4">No projects in this area yet.</p>
                            <CreateProjectDialog
                                defaultAreaId={area.id}
                                trigger={<Button variant="outline">Create Project</Button>}
                            />
                        </div>
                    ) : (
                        area.projects.map(project => (
                            <Link key={project.id} href={`/projects/${project.id}`}>
                                <Card className="hover:bg-white/5 transition-colors cursor-pointer border-white/10 h-full">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Folder className="h-4 w-4 text-muted-foreground" />
                                            {project.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {project.description ? (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {project.description}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">
                                                No description
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
