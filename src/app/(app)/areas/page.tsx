import { getAreas } from '@/lib/actions/areas'
import { getBalanceData } from '@/lib/actions/balance'
import { CreateAreaDialog } from '@/components/areas/create-area-dialog'
import { BalanceVisualization } from '@/components/areas/balance-visualization'
import { AreaCard } from '@/components/areas/area-card'
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
        <div className="flex flex-col h-full overflow-hidden bg-gradient-to-br from-background to-background/50">
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                            Areas of Life
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Manage your high-level domains and maintain balance.
                        </p>
                    </div>
                    <CreateAreaDialog />
                </div>

                {/* Balance Visualization */}
                {areas.length > 0 && (
                    <section className="w-full">
                        <BalanceVisualization data={balanceData} />
                    </section>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                    {areas.map((area, index) => {
                        const stats = balanceData.find(b => b.name === area.name)
                        return (
                            <AreaCard key={area.id} area={area} index={index} stats={stats} />
                        )
                    })}

                    {areas.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-16 border-2 border-dashed border-white/10 rounded-2xl text-center bg-white/5 backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                <Folder className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No Areas Defined</h3>
                            <p className="max-w-md mx-auto text-muted-foreground mb-6">
                                Break your life into core areas like Work, Health, Money, or Learning to keep things balanced.
                            </p>
                            <CreateAreaDialog />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
