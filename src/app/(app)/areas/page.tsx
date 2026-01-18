import { getAreas } from '@/lib/actions/areas'
import { getBalanceData } from '@/lib/actions/balance'
import { CreateAreaDialog } from '@/components/areas/create-area-dialog'
import { BalanceVisualization } from '@/components/areas/balance-visualization'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Folder } from 'lucide-react'
import { AreaOfLife, Project } from '@prisma/client'

type AreaWithProjects = AreaOfLife & { projects: Project[] }

export default async function AreasPage() {
    const [areas, balanceData] = await Promise.all([
        getAreas() as Promise<AreaWithProjects[]>,
        getBalanceData()
    ])

    return (
        <div className="flex flex-col h-full p-8 space-y-8 overflow-y-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Areas of Life</h1>
                    <p className="text-muted-foreground mt-1">
                        Organize your projects into high-level categories.
                    </p>
                </div>
                <CreateAreaDialog />
            </div>

            {/* Balance Visualization */}
            {areas.length > 0 && (
                <BalanceVisualization data={balanceData} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {areas.map(area => (
                    <Card key={area.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full bg-${area.color || 'gray'}-500`} />
                                    {area.name}
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 mt-2">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Projects
                                </div>
                                {area.projects.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No projects yet</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {area.projects.map(project => (
                                            <li key={project.id}>
                                                <Link
                                                    href={`/projects/${project.id}`}
                                                    className="flex items-center gap-2 text-sm hover:underline group"
                                                >
                                                    <Folder className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                    {project.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {areas.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                        <Folder className="h-12 w-12 mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold">No Areas Defined</h3>
                        <p className="max-w-sm mx-auto mt-2">
                            Break your life into core areas like Work, Health, Money, or Learning to keep things balanced.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
