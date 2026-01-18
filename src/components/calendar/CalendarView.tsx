'use client'

import { useState } from 'react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'
import { Button } from '@/components/ui/button'
import { WeekView } from './WeekView'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface CalendarViewProps {
  initialScheduledTasks: any[]
  initialUnscheduledTasks: any[]
}

export function CalendarView({ initialScheduledTasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const handlePrevious = () => {
    setCurrentDate(subWeeks(currentDate, 1))
  }

  const handleNext = () => {
    setCurrentDate(addWeeks(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h2 className="text-lg font-semibold">
          {`${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`}
        </h2>

        <div className="w-[200px]" /> {/* Spacer for balance */}
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden">
        <WeekView currentDate={currentDate} tasks={initialScheduledTasks} />
      </div>
    </div>
  )
}
