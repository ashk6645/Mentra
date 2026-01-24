'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useMemo, useState } from 'react'

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

// Utility to get color hex codes from tailwind-like names (simplified mapping)
const getColorHex = (colorName: string) => {
    const colors: Record<string, string> = {
        red: '#ef4444',
        orange: '#f97316',
        amber: '#f59e0b',
        yellow: '#eab308',
        lime: '#84cc16',
        green: '#22c55e',
        emerald: '#10b981',
        teal: '#14b8a6',
        cyan: '#06b6d4',
        sky: '#0ea5e9',
        blue: '#3b82f6',
        indigo: '#6366f1',
        violet: '#8b5cf6',
        purple: '#a855f7',
        fuchsia: '#d946ef',
        pink: '#ec4899',
        rose: '#f43f5e',
        neutral: '#737373',
        slate: '#64748b',
        gray: '#6b7280',
        zinc: '#71717a',
        stone: '#78716c',
    }
    return colors[colorName] || colors.neutral
}

export function BalanceVisualization({ data }: BalanceVisualizationProps) {
    const [hoveredArea, setHoveredArea] = useState<string | null>(null)

    // Calculate points for the radar chart
    const radarData = useMemo(() => {
        if (!data) return null

        const totalPoints = data.length
        const radius = 100
        const center = { x: 150, y: 150 }
        const angleStep = (Math.PI * 2) / totalPoints

        const points = data.map((area, index) => {
            const angle = index * angleStep - Math.PI / 2 // Start from top
            // Normalize value: if no tasks, visual min is 10% for visibility
            // If tasks exist, we use the percentage of completion or task distribution
            // Let's use percentage completed as the metric for "Balance" 
            // OR maybe even better: use a mix of 'magnitude' (task count relative to max) and 'completion'
            // For simplicity and "Life Balance" meaning, typically it means attention given vs needed.
            // Let's stick to the current implementation's logic (data.percentage) but ensure it's visible.

            const value = Math.max(area.percentage, 10) // Min 10% radius
            const distance = (value / 100) * radius

            return {
                x: center.x + Math.cos(angle) * distance,
                y: center.y + Math.sin(angle) * distance,
                name: area.name,
                value: area.percentage,
                color: getColorHex(area.color),
                original: area,
                angle,
                maxPoint: {
                    x: center.x + Math.cos(angle) * radius,
                    y: center.y + Math.sin(angle) * radius
                }
            }
        })

        return { points, center, radius }
    }, [data])

    if (!data || data.length === 0) {
        return (
            <Card className="bg-white/5 backdrop-blur-md border border-white/10">
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

    if (!radarData) {
        // Fallback for < 3 items where radar chart doesn't make sense
        return (
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 transition-all hover:bg-white/10">
                <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        Life Areas Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {data.map(area => (
                        <div key={area.name} className="space-y-2 group">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: getColorHex(area.color) }} />
                                    {area.name}
                                </span>
                                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                                    {area.percentage}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${area.percentage}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: getColorHex(area.color) }}
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    const { points, center } = radarData

    // For specific visual effect and "filling", if we have few points (like 1 or 2),
    // a simple line or dot doesn't "fill". Anchoring to center makes it a shape.
    // For 3+ points, standard radar chart logic applies (closed loop).
    let polygonPoints = points
    if (points.length < 3) {
        polygonPoints = [...points, {
            x: center.x,
            y: center.y,
            name: 'center',
            value: 0,
            color: 'transparent',
            angle: 0,
            maxPoint: center,
            original: data[0] // Mock original to satisfy type
        }]
    }

    const polyPoints = polygonPoints.map(p => `${p.x},${p.y}`).join(' ')

    return (
        <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="relative z-10 pb-2">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                    Life Balance Matrix
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Visualizing your progress across all areas
                </p>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                {/* Radar Chart */}
                <div className="relative w-[300px] h-[300px] flex-shrink-0">
                    <svg width="300" height="300" className="overflow-visible">
                        <defs>
                            {polygonPoints.map((point, i) => {
                                const nextPoint = polygonPoints[(i + 1) % polygonPoints.length]
                                // Skip degenerate slices if using the center-mock hack
                                if (point.name === 'center' || nextPoint.name === 'center') return null

                                return (
                                    <linearGradient
                                        key={`gradient-${i}`}
                                        id={`sliceGradient-${i}`}
                                        x1="0%"
                                        y1="0%"
                                        x2="100%"
                                        y2="100%"
                                        gradientUnits="userSpaceOnUse"
                                        gradientTransform={`rotate(${point.angle}, ${center.x}, ${center.y})`}
                                    >
                                        <stop offset="0%" stopColor={getColorHex(point.color)} stopOpacity={0.6} />
                                        <stop offset="100%" stopColor={getColorHex(nextPoint.color)} stopOpacity={0.6} />
                                    </linearGradient>
                                )
                            })}
                        </defs>

                        {/* Background Webs - Thicker and more visible */}
                        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                            <motion.circle
                                key={scale}
                                cx={center.x}
                                cy={center.y}
                                r={100 * scale}
                                fill="none"
                                stroke="currentColor"
                                strokeOpacity={scale === 1 ? 0.3 : 0.1}
                                strokeWidth={scale === 1 ? 2 : 1}
                                strokeDasharray={scale === 1 ? "0" : "4 4"}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                            />
                        ))}

                        {/* Axes */}
                        {points.map((p, i) => (
                            <motion.line
                                key={`axis-${i}`}
                                x1={center.x}
                                y1={center.y}
                                x2={p.maxPoint.x}
                                y2={p.maxPoint.y}
                                stroke="currentColor"
                                strokeOpacity={0.2}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                            />
                        ))}

                        {/* Data Slices (Fill Only) */}
                        {polygonPoints.map((point, i) => {
                            const nextPoint = polygonPoints[(i + 1) % polygonPoints.length]
                            if (point.name === 'center' || nextPoint.name === 'center') return null

                            const pathData = `M ${center.x},${center.y} L ${point.x},${point.y} L ${nextPoint.x},${nextPoint.y} Z`

                            return (
                                <motion.path
                                    key={`slice-${i}`}
                                    d={pathData}
                                    fill={`url(#sliceGradient-${i})`}
                                    stroke="none"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    style={{ transformOrigin: `${center.x}px ${center.y}px` }}
                                />
                            )
                        })}

                        {/* Unified Outline */}
                        <motion.polygon
                            points={polyPoints}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="drop-shadow-sm text-foreground"
                        />

                        {/* Axis Tip Markers */}
                        {points.map((p, i) => {
                            // Only draw markers for actual data points (not center mock)
                            if (p.name === 'center') return null
                            return (
                                <motion.rect
                                    key={`marker-${i}`}
                                    x={p.maxPoint.x - 4}
                                    y={p.maxPoint.y - 4}
                                    width={8}
                                    height={8}
                                    rx={2}
                                    fill={getColorHex(p.color)}
                                    stroke="currentColor"
                                    strokeWidth={1}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className="drop-shadow-sm text-foreground"
                                />
                            )
                        })}

                        {/* Interactive Points (The actual measurement dots) */}
                        {points.map((p, i) => (
                            <motion.g
                                key={p.name}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                onHoverStart={() => setHoveredArea(p.name)}
                                onHoverEnd={() => setHoveredArea(null)}
                            >
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={6}
                                    fill={p.color}
                                    className="cursor-pointer hover:brightness-125 transition-all"
                                    stroke="white"
                                    strokeWidth={2}
                                />
                                {/* Label for points */}
                                <text
                                    x={p.maxPoint.x + (Math.cos(p.angle) * 18)}
                                    y={p.maxPoint.y + (Math.sin(p.angle) * 18)}
                                    textAnchor={
                                        Math.cos(p.angle) > 0.1 ? 'start' :
                                            Math.cos(p.angle) < -0.1 ? 'end' :
                                                'middle'
                                    }
                                    dominantBaseline="middle"
                                    fill="currentColor"
                                    className="text-[10px] font-medium fill-muted-foreground uppercase tracking-wider"
                                >
                                    {p.name}
                                </text>
                            </motion.g>
                        ))}
                    </svg>
                </div>

                {/* Legend & Stats */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.map((area, i) => (
                        <motion.div
                            key={area.name}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className={`p-3 rounded-lg border border-transparent transition-all duration-300 ${hoveredArea === area.name
                                ? 'bg-muted border-muted-foreground/20 scale-[1.02]'
                                : 'hover:bg-muted/50'
                                }`}
                            onMouseEnter={() => setHoveredArea(area.name)}
                            onMouseLeave={() => setHoveredArea(null)}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className="w-2 h-8 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                                    style={{ backgroundColor: getColorHex(area.color) }}
                                />
                                <div>
                                    <h4 className="font-semibold text-sm leading-none mb-1">{area.name}</h4>
                                    <p className="text-xs text-muted-foreground">{area.taskCount} tasks</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <span className="text-xl font-bold">{area.percentage}%</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: getColorHex(area.color) }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${area.percentage}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}