'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

export type CalendarViewType = 'year' | 'month' | 'week' | 'day'

interface CalendarHeaderProps {
    currentDate: Date
    view: CalendarViewType
    onViewChange: (view: CalendarViewType) => void
    onNavigate: (direction: 'prev' | 'next' | 'today') => void
}

export function CalendarHeader({ currentDate, view, onViewChange, onNavigate }: CalendarHeaderProps) {
    const getHeaderText = () => {
        switch (view) {
            case 'year':
                return format(currentDate, 'yyyy')
            case 'month':
                return format(currentDate, 'MMMM yyyy')
            case 'week':
                return `Week of ${format(currentDate, 'MMM d, yyyy')}`
            case 'day':
                return format(currentDate, 'MMMM d, yyyy')
            default:
                return format(currentDate, 'MMMM yyyy')
        }
    }

    return (
        <div className="flex items-center justify-between p-4 md:pl-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <div className="flex items-center rounded-md border shadow-sm bg-background">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none rounded-l-md border-r hover:bg-muted"
                        onClick={() => onNavigate('prev')}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-none font-normal px-4 hover:bg-muted"
                        onClick={() => onNavigate('today')}
                    >
                        Today
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none rounded-r-md border-l hover:bg-muted"
                        onClick={() => onNavigate('next')}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <h2 className="text-xl font-semibold ml-4 min-w-[150px]">
                    {getHeaderText()}
                </h2>
            </div>

            <div className="flex items-center gap-2">
                <Select value={view} onValueChange={(v) => onViewChange(v as CalendarViewType)}>
                    <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent align="end">
                        <SelectItem value="year">Year</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="day">Day</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant="default" size="sm" className="hidden md:flex">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    New Event
                </Button>
            </div>
        </div>
    )
}
