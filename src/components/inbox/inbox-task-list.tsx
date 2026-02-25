'use client'

import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

interface InboxTaskListProps {
    tasks: any[]
}

export function InboxTaskList({ tasks }: InboxTaskListProps) {
    if (tasks.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-col items-center justify-center py-20 px-4 text-center"
            >
                {/* Visual */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.2
                    }}
                    className="relative mb-6"
                >
                    <div className="flex items-center justify-center w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-500 mb-2 ring-8 ring-blue-50/50 dark:ring-blue-900/10">
                        <Inbox className="w-10 h-10" />
                    </div>
                </motion.div>

                {/* Encouraging copy */}
                <motion.h3
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="text-xl font-semibold text-foreground mb-2"
                >
                    Inbox Zero!
                </motion.h3>
                <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="text-[15px] text-muted-foreground/80 max-w-sm mb-6"
                >
                    You're all caught up. New ideas and tasks will appear here when you capture them.
                </motion.p>
            </motion.div>
        )
    }

    return <SortableTaskList tasks={tasks} />
}
