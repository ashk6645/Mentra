'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { SectionHeader } from './section-header'
import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { CreateTaskInline } from '@/components/tasks/create-task-inline'

interface SortableSectionProps {
    section: any
    activeTasks: any[]
    completedTasks: any[]
    projectId: string
}

export function SortableSection({
    section,
    activeTasks,
    completedTasks,
    projectId,
}: SortableSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 999 : 1,
    }

    const totalTasks = activeTasks.length + completedTasks.length

    return (
        <div ref={setNodeRef} style={style} className={isExpanded ? 'mb-8' : 'mb-2'}>
            <SectionHeader
                section={section}
                taskCount={totalTasks}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
                dragHandleProps={{ ...attributes, ...listeners }}
            />

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                            opacity: 1,
                            height: "auto",
                        }}
                        exit={{
                            opacity: 0,
                            height: 0,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            mass: 0.8,
                            opacity: { duration: 0.2 }
                        }}
                        style={{ overflow: "hidden" }}
                    >
                        <div className="pt-1">
                            {/* Active Tasks in Section */}
                            {activeTasks.length > 0 ? (
                                <div className="mb-4 ml-8">
                                    <SortableTaskList tasks={activeTasks} />
                                </div>
                            ) : (
                                completedTasks.length === 0 && (
                                    <div className="py-6 text-center ml-8">
                                        <p className="text-sm text-muted-foreground/40">
                                            No tasks in this section
                                        </p>
                                    </div>
                                )
                            )}

                            {/* Section Quick Add */}
                            <div className="mb-3 ml-8 max-w-xl">
                                <CreateTaskInline
                                    defaultProjectId={projectId}
                                    defaultSectionId={section.id}
                                    placeholder={`Add a task to ${section.name}...`}
                                    variant="compact"
                                />
                            </div>

                            {/* Completed Tasks in Section */}
                            {completedTasks.length > 0 && (
                                <div className="ml-8">
                                    <SortableTaskList tasks={completedTasks} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}
