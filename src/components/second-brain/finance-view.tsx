'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Metric, MetricRow, Panel, SectionHeader, ProgressBar } from './primitives'
import { useSecondBrainData, useSecondBrainActions, useStoreReady, createId } from '@/lib/second-brain/repo'
import { todayKey, longDateLabel, monthLabel } from '@/lib/second-brain/date'
import { monthRange } from '@/lib/second-brain/domain/selectors'
import type { TransactionCategory, TransactionKind } from '@/lib/second-brain/domain/types'
import { R, T, INK, NUM, FOCUS, HOVER, HAIRLINE } from '@/lib/second-brain/ui'

const CATEGORIES: TransactionCategory[] = [
    'housing', 'food', 'transport', 'shopping', 'technology',
    'fitness', 'education', 'entertainment', 'subscriptions', 'salary', 'other',
]

const CATEGORY_LABEL: Record<TransactionCategory, string> = {
    housing: 'Housing', food: 'Food', transport: 'Transport', shopping: 'Shopping',
    technology: 'Technology', fitness: 'Fitness', education: 'Education',
    entertainment: 'Entertainment', subscriptions: 'Subscriptions',
    salary: 'Salary', other: 'Other',
}

/**
 * Money is stored in minor units and only ever divided at the edge.
 *
 * Floats cannot represent 0.1 exactly, so summing them accumulates error that
 * eventually shows up as a total ending in .0000000001. Integers in, one division
 * out — the standard way to avoid the entire class of bug.
 */
function formatMoney(minor: number): string {
    const sign = minor < 0 ? '-' : ''
    const abs = Math.abs(minor)
    return `${sign}₹${(abs / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function FinanceView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { create, replace } = useSecondBrainActions()

    const [anchor, setAnchor] = useState(() => new Date())
    const [draft, setDraft] = useState({ description: '', amount: '', category: 'food' as TransactionCategory })

    const days = useMemo(() => new Set(monthRange(anchor)), [anchor])

    const transactions = useMemo(
        () =>
            data.transactions
                .filter(t => days.has(t.date))
                .sort((a, b) => b.date.localeCompare(a.date)),
        [data.transactions, days]
    )

    const totals = useMemo(() => {
        let income = 0
        let expense = 0

        for (const t of transactions) {
            if (t.kind === 'income') income += t.amountMinor
            else expense += t.amountMinor
        }

        const byCategory = new Map<TransactionCategory, number>()
        for (const t of transactions) {
            if (t.kind !== 'expense') continue
            byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amountMinor)
        }

        return {
            income,
            expense,
            net: income - expense,
            // Saved as a share of what came in. Meaningless without income, so
            // it reports null rather than a misleading 0% or a division by zero.
            savedPercent: income === 0 ? null : Math.round(((income - expense) / income) * 100),
            categories: [...byCategory.entries()].sort((a, b) => b[1] - a[1]),
        }
    }, [transactions])

    const step = (delta: number) => {
        const next = new Date(anchor)
        next.setDate(1)
        next.setMonth(next.getMonth() + delta)
        setAnchor(next)
    }

    const addTransaction = useCallback(
        (kind: TransactionKind) => {
            const rupees = Number(draft.amount)
            if (!rupees || rupees <= 0) return

            const stamp = new Date().toISOString()
            create('transactions', {
                id: createId('txn'),
                createdAt: stamp,
                updatedAt: stamp,
                kind,
                // Multiply into minor units at the boundary, once.
                amountMinor: Math.round(rupees * 100),
                category: kind === 'income' ? 'salary' : draft.category,
                date: todayKey(),
                description: draft.description.trim() || CATEGORY_LABEL[draft.category],
            })

            setDraft({ description: '', amount: '', category: draft.category })
        },
        [create, draft]
    )

    const remove = useCallback(
        (id: string) => replace('transactions', data.transactions.filter(t => t.id !== id)),
        [data.transactions, replace]
    )

    if (!ready) {
        return (
            <div className="flex flex-col gap-4" aria-busy>
                <div className="h-[74px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
                <div className="h-[280px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
            </div>
        )
    }

    const maxCategory = totals.categories[0]?.[1] ?? 1

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-0.5">
                <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous month"
                    className={cn('flex h-7 w-7 items-center justify-center', R.md, INK.muted,
                        'transition-colors hover:bg-foreground/[0.06] hover:text-foreground', FOCUS)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className={cn('min-w-[128px] text-center', T.button, INK.strong)}>
                    {monthLabel(anchor)}
                </span>
                <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next month"
                    className={cn('flex h-7 w-7 items-center justify-center', R.md, INK.muted,
                        'transition-colors hover:bg-foreground/[0.06] hover:text-foreground', FOCUS)}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <MetricRow>
                <Metric value={formatMoney(totals.income)} label="Income" animate={false} />
                <Metric value={formatMoney(totals.expense)} label="Spent" animate={false} />
                <Metric
                    value={formatMoney(totals.net)}
                    label={totals.savedPercent === null ? 'Net' : `Net · ${totals.savedPercent}% saved`}
                    animate={false}
                />
            </MetricRow>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
                {/* Where it went */}
                <section>
                    <SectionHeader title="Where it went" count={totals.categories.length} />

                    {totals.categories.length === 0 ? (
                        <Panel className="py-10 text-center">
                            <p className={cn(T.body, INK.subtle)}>No spending this month.</p>
                        </Panel>
                    ) : (
                        <Panel className="flex flex-col gap-3">
                            {totals.categories.map(([category, amount]) => (
                                <div key={category} className="flex items-center gap-3">
                                    <span className={cn('w-24 shrink-0 truncate', T.body, INK.default)}>
                                        {CATEGORY_LABEL[category]}
                                    </span>
                                    {/* Relative to the largest category, so the bars
                                        compare against each other rather than against
                                        an arbitrary ceiling. */}
                                    <ProgressBar percent={(amount / maxCategory) * 100} className="flex-1" />
                                    <span className={cn('w-16 shrink-0 text-right text-[11px]', NUM, INK.muted)}>
                                        {formatMoney(amount)}
                                    </span>
                                </div>
                            ))}
                        </Panel>
                    )}
                </section>

                {/* Add + list */}
                <section className="flex flex-col gap-4">
                    <SectionHeader title="Transactions" count={transactions.length} />

                    <Panel className="flex flex-col gap-2.5">
                        <div className="flex gap-2">
                            <input
                                value={draft.description}
                                onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                                placeholder="What was it?"
                                aria-label="Description"
                                className={cn('min-w-0 flex-1 border bg-transparent px-2.5 py-2', R.md, T.body,
                                    HAIRLINE, 'placeholder:text-muted-foreground/50 outline-none focus:border-primary/40')}
                            />
                            <input
                                value={draft.amount}
                                onChange={e => setDraft(d => ({ ...d, amount: e.target.value.replace(/[^\d.]/g, '') }))}
                                inputMode="decimal"
                                placeholder="0"
                                aria-label="Amount"
                                className={cn('w-24 border bg-transparent px-2.5 py-2 text-right', R.md, T.body, NUM,
                                    HAIRLINE, 'placeholder:text-muted-foreground/50 outline-none focus:border-primary/40')}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={draft.category}
                                onChange={e => setDraft(d => ({ ...d, category: e.target.value as TransactionCategory }))}
                                aria-label="Category"
                                className={cn('border bg-transparent px-2 py-1.5', R.md, T.body, HAIRLINE,
                                    'outline-none focus:border-primary/40')}
                            >
                                {CATEGORIES.filter(c => c !== 'salary').map(c => (
                                    <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                                ))}
                            </select>

                            <div className="ml-auto flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => addTransaction('expense')}
                                    disabled={!draft.amount}
                                    className={cn('flex items-center gap-1.5 px-3 py-1.5', R.md, T.button,
                                        'bg-foreground text-background transition-opacity hover:opacity-90',
                                        'disabled:pointer-events-none disabled:opacity-30', FOCUS)}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addTransaction('income')}
                                    disabled={!draft.amount}
                                    className={cn('px-3 py-1.5 border', R.md, T.button, INK.default, HAIRLINE,
                                        'transition-colors hover:bg-foreground/[0.04]',
                                        'disabled:pointer-events-none disabled:opacity-30', FOCUS)}
                                >
                                    Income
                                </button>
                            </div>
                        </div>
                    </Panel>

                    <div className="flex flex-col">
                        {transactions.length === 0 ? (
                            <p className={cn('px-2 py-6', T.body, INK.subtle)}>Nothing recorded this month.</p>
                        ) : (
                            transactions.map(txn => (
                                <div key={txn.id} className={cn('group flex items-center gap-3 px-2 py-2', R.md, HOVER)}>
                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className={cn('truncate', T.body, INK.default)}>{txn.description}</span>
                                        <span className={cn('text-[11px]', INK.subtle)}>
                                            {CATEGORY_LABEL[txn.category]} · {longDateLabel(txn.date).split(',')[1]?.trim()}
                                        </span>
                                    </div>

                                    <span
                                        className={cn('shrink-0 text-[12.5px] font-medium', NUM,
                                            txn.kind === 'income'
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : INK.default)}
                                    >
                                        {txn.kind === 'income' ? '+' : '−'}{formatMoney(txn.amountMinor)}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => remove(txn.id)}
                                        aria-label={`Delete ${txn.description}`}
                                        className={cn('flex h-7 w-7 shrink-0 items-center justify-center', R.sm, INK.subtle,
                                            'opacity-50 transition-all sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100',
                                            'hover:text-red-600 dark:hover:text-red-400', FOCUS)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
