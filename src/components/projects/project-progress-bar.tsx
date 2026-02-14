'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProjectProgressBarProps {
    totalTasks: number
    completedTasks: number
    className?: string
    showPercentage?: boolean
}

export function ProjectProgressBar({
    totalTasks,
    completedTasks,
    className,
    showPercentage = true,
}: ProjectProgressBarProps) {
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Determine color based on completion percentage
    const getProgressColor = () => {
        if (percentage === 100) return 'bg-success'
        if (percentage >= 75) return 'bg-blue-500'
        if (percentage >= 50) return 'bg-primary'
        if (percentage >= 25) return 'bg-orange-500'
        return 'bg-muted-foreground/30'
    }

    const getTextColor = () => {
        if (percentage === 100) return 'text-success'
        if (percentage >= 75) return 'text-blue-500'
        if (percentage >= 50) return 'text-primary'
        if (percentage >= 25) return 'text-orange-500'
        return 'text-muted-foreground'
    }

    return (
        <div className={cn('space-y-2', className)}>
            {/* Progress bar container */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30">
                {/* Animated progress fill */}
                <motion.div
                    className={cn('h-full rounded-full', getProgressColor())}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 20,
                        mass: 0.5,
                    }}
                />
            </div>

            {/* Percentage text */}
            {showPercentage && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="flex items-center justify-between text-xs"
                >
                    <span className="text-muted-foreground">
                        {completedTasks} of {totalTasks} tasks completed
                    </span>
                    <span className={cn('font-semibold', getTextColor())}>
                        {percentage}%
                    </span>
                </motion.div>
            )}
        </div>
    )
}
