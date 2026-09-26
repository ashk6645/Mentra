'use client'

import { Check, CheckCircle2, Rows3, Search, SlidersHorizontal, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/second-brain/primitives'
import { OptionRow, POPOVER } from '@/components/task-detail/parts'
import { cn } from '@/lib/utils'
import { TASK_COLUMNS } from './columns'
import type { GroupBy, TaskColumnId } from './types'
import { FIELD_FOCUS, HAIRLINE, ICON, INK, NUM, R, T, TRANSITION } from '@/lib/second-brain/ui'

interface ToolbarProps {
    query: string
    onQueryChange: (query: string) => void
    showCompleted: boolean
    onShowCompletedChange: (show: boolean) => void
    completedCount: number
    groupBy: GroupBy
    onGroupByChange: (groupBy: GroupBy) => void
    /** Grouping is only offered when there are sections to group by. */
    canGroup: boolean
    hidden: TaskColumnId[]
    onHiddenChange: (hidden: TaskColumnId[]) => void
    /** Columns that don't apply here, e.g. Section outside a project. */
    unavailable: TaskColumnId[]
}

const Divider = () => <div className={cn('my-1 border-t', HAIRLINE)} />

/**
 * Filter, show completed, group, and choose columns — everything about how the
 * table looks, nothing about what's in it.
 */
export function TaskTableToolbar({
    query,
    onQueryChange,
    showCompleted,
    onShowCompletedChange,
    completedCount,
    groupBy,
    onGroupByChange,
    canGroup,
    hidden,
    onHiddenChange,
    unavailable,
}: ToolbarProps) {
    const hideable = TASK_COLUMNS.filter(column => column.hideable && !unavailable.includes(column.id))
    const hiddenCount = hideable.filter(column => hidden.includes(column.id)).length

    const toggleColumn = (id: TaskColumnId) =>
        onHiddenChange(hidden.includes(id) ? hidden.filter(h => h !== id) : [...hidden, id])

    return (
        <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Filter */}
            <label className={cn('relative flex h-8 w-full items-center sm:w-64')}>
                <Search className={cn(ICON.md, 'pointer-events-none absolute left-2.5', INK.subtle)} strokeWidth={2} />
                <input
                    value={query}
                    onChange={e => onQueryChange(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Escape' && query) {
                            e.stopPropagation()
                            onQueryChange('')
                        }
                    }}
                    placeholder="Filter tasks"
                    aria-label="Filter tasks"
                    className={cn(
                        'h-8 w-full border bg-transparent pl-8 pr-8', R.md, HAIRLINE, T.body, INK.strong,
                        'placeholder:text-muted-foreground/55', TRANSITION.fast, FIELD_FOCUS
                    )}
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => onQueryChange('')}
                        aria-label="Clear filter"
                        className={cn('absolute right-1.5 flex h-5 w-5 items-center justify-center rounded-[5px]', INK.subtle,
                            'hover:bg-black/[0.06] hover:text-foreground dark:hover:bg-white/[0.08]')}
                    >
                        <X className={ICON.sm} strokeWidth={2.25} />
                    </button>
                )}
            </label>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    icon={CheckCircle2}
                    aria-pressed={showCompleted}
                    onClick={() => onShowCompletedChange(!showCompleted)}
                    className={cn(showCompleted && 'bg-black/[0.05] text-foreground dark:bg-white/[0.07]')}
                >
                    Completed
                    {completedCount > 0 && <span className={cn(NUM, INK.subtle)}>{completedCount}</span>}
                </Button>

                {canGroup && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" icon={Rows3}>
                                {groupBy === 'section' ? 'By section' : 'No grouping'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className={cn(POPOVER, 'w-44')}>
                            {([['section', 'By section'], ['none', 'No grouping']] as const).map(([value, label]) => (
                                <OptionRow key={value} selected={groupBy === value} onSelect={() => onGroupByChange(value)}>
                                    <span className="flex-1">{label}</span>
                                    {groupBy === value && <Check className={cn(ICON.md, INK.muted)} />}
                                </OptionRow>
                            ))}
                        </PopoverContent>
                    </Popover>
                )}

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" icon={SlidersHorizontal}>
                            Columns
                            {hiddenCount > 0 && <span className={cn(NUM, INK.subtle)}>{hideable.length - hiddenCount}/{hideable.length}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className={cn(POPOVER, 'w-48')}>
                        <p className={cn('px-2 pb-1 pt-1.5', T.caption, INK.subtle)}>Show columns</p>
                        {hideable.map(column => {
                            const visible = !hidden.includes(column.id)
                            return (
                                <OptionRow key={column.id} selected={false} onSelect={() => toggleColumn(column.id)}>
                                    <span
                                        className={cn(
                                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border', TRANSITION.fast,
                                            visible ? 'border-foreground bg-foreground text-background' : 'border-black/[0.2] dark:border-white/[0.25]'
                                        )}
                                    >
                                        {visible && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                                    </span>
                                    <span className="flex-1">{column.label ?? column.header}</span>
                                </OptionRow>
                            )
                        })}
                        {hiddenCount > 0 && (
                            <>
                                <Divider />
                                <OptionRow onSelect={() => onHiddenChange([])}>
                                    <span className={INK.muted}>Show all</span>
                                </OptionRow>
                            </>
                        )}
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}
