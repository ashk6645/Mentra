'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface AreaBalance {
    name: string
    color: string
    taskCount: number
    completedCount: number
    percentage: number
}

interface BalanceVisualizationProps {
    data: AreaBalance[]
}

export function BalanceVisualization({ data }: BalanceVisualizationProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Life Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Create Areas of Life and assign projects to see your balance here.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const totalTasks = data.reduce((sum, area) => sum + area.taskCount, 0)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Life Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Distribution Bar */}
                <div className="relative h-8 rounded-full overflow-hidden bg-muted flex">
                    {data.map((area, index) => {
                        const width = totalTasks > 0 ? (area.taskCount / totalTasks) * 100 : 0
                        if (width === 0) return null
                        return (
                            <div
                                key={area.name}
                                className={`h-full bg-${area.color || 'gray'}-500 transition-all`}
                                style={{ width: `${width}%` }}
                                title={`${area.name}: ${area.taskCount} tasks`}
                            />
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-3">
                    {data.map(area => (
                        <div key={area.name} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${area.color || 'gray'}-500`} />
                            <span className="text-sm font-medium truncate">{area.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                                {area.taskCount}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Completion Progress per Area */}
                <div className="space-y-3 pt-2 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground">Completion Progress</h4>
                    {data.map(area => (
                        <div key={area.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>{area.name}</span>
                                <span className="text-muted-foreground">
                                    {area.completedCount}/{area.taskCount} ({area.percentage}%)
                                </span>
                            </div>
                            <Progress value={area.percentage} className="h-2" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
