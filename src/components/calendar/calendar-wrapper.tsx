'use client'

import { useState } from 'react'
import { CalendarHeader, CalendarViewType } from './calendar-header'
import { addDays, addMonths, addWeeks, addYears, subDays, subMonths, subWeeks, subYears } from 'date-fns'
import { MonthView } from './views/month-view'
import { WeekView } from './views/week-view'
import { DayView } from './views/day-view'
import { YearView } from './views/year-view'

interface CalendarWrapperProps {
    initialScheduledTasks: any[]
    initialUnscheduledTasks: any[]
}

export function CalendarWrapper({ initialScheduledTasks, initialUnscheduledTasks }: CalendarWrapperProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<CalendarViewType>('month')
    const [tasks, setTasks] = useState(initialScheduledTasks)

    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        if (direction === 'today') {
            setCurrentDate(new Date())
            return
        }

        const modifier = direction === 'next' ? 1 : -1

        switch (view) {
            case 'year':
                setCurrentDate(d => direction === 'next' ? addYears(d, 1) : subYears(d, 1))
                break
            case 'month':
                setCurrentDate(d => direction === 'next' ? addMonths(d, 1) : subMonths(d, 1))
                break
            case 'week':
                setCurrentDate(d => direction === 'next' ? addWeeks(d, 1) : subWeeks(d, 1))
                break
            case 'day':
                setCurrentDate(d => direction === 'next' ? addDays(d, 1) : subDays(d, 1))
                break
        }
    }

    const renderView = () => {
        switch (view) {
            case 'year':
                return <YearView currentDate={currentDate} tasks={tasks} />
            case 'month':
                return <MonthView currentDate={currentDate} tasks={tasks} />
            case 'week':
                return <WeekView currentDate={currentDate} tasks={tasks} />
            case 'day':
                return <DayView currentDate={currentDate} tasks={tasks} />
            default:
                return <MonthView currentDate={currentDate} tasks={tasks} />
        }
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <CalendarHeader
                currentDate={currentDate}
                view={view}
                onViewChange={setView}
                onNavigate={handleNavigate}
            />
            <div className="flex-1 overflow-hidden">
                {renderView()}
            </div>
        </div>
    )
}
