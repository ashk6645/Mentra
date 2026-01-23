'use client'

import Link from 'next/link'
import { Plus, Timer, Flame, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuickActions() {
  const actions = [
    {
      label: 'New task',
      href: '/tasks',
      icon: Plus,
    },
    {
      label: 'Focus mode',
      href: '/focus',
      icon: Timer,
    },
    {
      label: 'Habits',
      href: '/habits',
      icon: Flame,
    },
    {
      label: 'Calendar',
      href: '/calendar',
      icon: Calendar,
    },
  ]

  return (
    <section className="space-y-3">
      {/* Section title */}
      <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
        Quick actions
      </p>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              'group flex items-center gap-3 rounded-lg border px-3 py-2.5',
              'bg-card hover:bg-muted/40',
              'transition-colors'
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                'border bg-background',
                'text-muted-foreground',
                'group-hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            <span className="text-sm font-medium leading-none">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
