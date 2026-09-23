'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Flag, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Card, EmptyState, PageHeader, Reveal, Ring, Stat, StatGrid } from './primitives'
import { Segmented } from './segmented'
import { Panel } from './overlay'
import { GoalRow } from './goal-row'
import { GoalPanel } from './goal-panel'
import { useShortcuts, type Shortcut } from '@/lib/second-brain/use-shortcuts'
import { useSecondBrainData, useStoreReady } from '@/lib/second-brain/repo'
import { createGoal, deleteGoal } from '@/lib/second-brain/actions'
import { todayKey } from '@/lib/second-brain/date'
import { goalPace } from '@/lib/second-brain/domain/selectors'
import type { Goal } from '@/lib/second-brain/domain/types'
import { DIVIDE, HAIRLINE, INK, T } from '@/lib/second-brain/ui'

type Filter = 'open' | 'achieved'

/**
 * Goals.
 *
 * A list you scan, and a panel you think in. The list answers "which of these
 * needs me?" — so anything behind pace rises to the top — and the panel holds
 * the rest: why it matters, how it's measured, and the milestones on the way.
 */
export function GoalsView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const router = useRouter()
    const pathname = usePathname()
    const params = useSearchParams()

    const [filter, setFilter] = useState<Filter>('open')
    // `open` is separate from `id`, and `last` keeps a copy of the goal, so the
    // panel still has something to show while it animates out — even when it is
    // closing because that goal was just deleted.
    const [panel, setPanel] = useState<{ id: string | null; open: boolean; last: Goal | null }>(() => ({
        id: params.get('goal'),
        open: params.get('goal') !== null,
        last: null,
    }))

    const today = todayKey()

    const rows = useMemo(
        () =>
            data.goals
                .map(goal => ({ goal, pace: goalPace(goal, data.milestones, today) }))
                .sort(
                    (a, b) =>
                        // Behind first, then active before paused, then by deadline.
                        Number(b.pace.behind) - Number(a.pace.behind) ||
                        Number(a.goal.status === 'paused') - Number(b.goal.status === 'paused') ||
                        a.goal.targetDate.localeCompare(b.goal.targetDate)
                ),
        [data.goals, data.milestones, today]
    )

    const open = rows.filter(r => r.goal.status !== 'achieved')
    const achieved = rows.filter(r => r.goal.status === 'achieved')
    const visible = filter === 'open' ? open : achieved

    const active = open.filter(r => r.goal.status === 'active')
    const onTrack = active.filter(r => !r.pace.behind).length

    const openPanel = useCallback((id: string) => setPanel({ id, open: true, last: null }), [])

    const closePanel = useCallback(() => {
        const goal = data.goals.find(g => g.id === panel.id) ?? null
        setPanel(prev => ({ ...prev, open: false, last: goal }))
        // A goal closed before it was given a title was never really made.
        if (goal && goal.title.trim() === '' && goal.why.trim() === '') deleteGoal(goal, { quiet: true })
        if (params.get('goal')) router.replace(pathname, { scroll: false })
    }, [data.goals, panel.id, params, pathname, router])

    const newGoal = useCallback(() => {
        setFilter('open')
        openPanel(createGoal())
    }, [openPanel])

    const shortcuts = useMemo<Shortcut[]>(() => [
        { key: 'n', display: 'N', description: 'New goal', run: newGoal },
    ], [newGoal])

    useShortcuts(shortcuts, ready && !panel.open)

    const live = data.goals.find(g => g.id === panel.id) ?? null
    const shown = live ?? panel.last

    return (
        <>
            <Reveal index={0}>
                <PageHeader
                    title="Goals"
                    description="Outcomes worth working toward, measured against the time they have left."
                    actions={<Button variant="primary" icon={Plus} kbd="N" onClick={newGoal}>New goal</Button>}
                />
            </Reveal>

            {ready && rows.length === 0 && (
                <Reveal index={1}>
                    <Card>
                        <EmptyState
                            icon={Flag}
                            title="No goals yet"
                            description="A goal has a finish line and a date. Give it a number or a few milestones, and it tells you if you're on pace."
                            action={<Button variant="primary" icon={Plus} onClick={newGoal}>New goal</Button>}
                        />
                    </Card>
                </Reveal>
            )}

            {ready && rows.length > 0 && (
                <>
                    <Reveal index={1}>
                        <StatGrid>
                            <Stat
                                label="On track"
                                value={onTrack}
                                suffix={`/${active.length}`}
                                detail={active.length - onTrack > 0 ? `${active.length - onTrack} behind pace` : 'Nothing behind'}
                                visual={<Ring percent={active.length === 0 ? 0 : (onTrack / active.length) * 100} />}
                            />
                            <Stat label="In progress" value={open.length} detail={`${open.length - active.length} paused`} />
                            <Stat label="Achieved" value={achieved.length} detail="all time" />
                        </StatGrid>
                    </Reveal>

                    <Reveal index={2}>
                        <Card>
                            <div className={cn('flex h-12 items-center justify-between gap-3 border-b px-3', HAIRLINE)}>
                                <Segmented
                                    options={[
                                        { id: 'open' as const, label: 'In progress', count: open.length },
                                        { id: 'achieved' as const, label: 'Achieved', count: achieved.length },
                                    ]}
                                    value={filter}
                                    onChange={setFilter}
                                    ariaLabel="Show"
                                />
                            </div>

                            {visible.length === 0 ? (
                                <EmptyState
                                    compact
                                    title={filter === 'open' ? 'Nothing in progress' : 'Nothing achieved yet'}
                                    description={filter === 'open' ? 'Every goal here is done. Time for a new one?' : 'Finished goals collect here.'}
                                />
                            ) : (
                                <div className={cn('divide-y', DIVIDE)}>
                                    {visible.map(({ goal, pace }) => (
                                        <GoalRow key={goal.id} goal={goal} milestones={data.milestones} pace={pace} onOpen={openPanel} />
                                    ))}
                                </div>
                            )}
                        </Card>
                    </Reveal>

                    <Reveal index={3}>
                        <p className={cn(T.meta, INK.subtle)}>
                            A goal is behind when its progress trails the share of its time already gone by more than ten points.
                        </p>
                    </Reveal>
                </>
            )}

            <Panel
                open={panel.open && live !== null}
                onOpenChange={next => {
                    if (!next) closePanel()
                }}
                label={shown?.title || 'Goal'}
            >
                {shown && (
                    <GoalPanel
                        goal={shown}
                        milestones={data.milestones}
                        today={today}
                        onDeleted={() => setPanel(prev => ({ ...prev, open: false, last: live }))}
                    />
                )}
            </Panel>
        </>
    )
}
