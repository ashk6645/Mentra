'use client'

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { TaskRow } from './task-row'
import { cn } from '@/lib/utils'

interface VirtualTaskListProps {
    tasks: any[]
    className?: string
}

export function VirtualTaskList({ tasks, className }: VirtualTaskListProps) {
    const parentRef = useRef<HTMLDivElement>(null)

    const virtualizer = useVirtualizer({
        count: tasks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 72, // Approximate height of a task row (padding + content)
        overscan: 5,
    })

    return (
        <div
            ref={parentRef}
            className={cn("h-full max-h-[800px] overflow-y-auto pr-2", className)}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="py-1"
                    >
                        <TaskRow task={tasks[virtualItem.index]} />
                    </div>
                ))}
            </div>
        </div>
    )
}
