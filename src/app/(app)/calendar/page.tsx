import { getScheduledTasks, getUnscheduledTasks } from '@/lib/actions/scheduling'
import { CalendarView } from '@/components/calendar/CalendarView'
import { startOfWeek, endOfWeek } from 'date-fns'

export const metadata = {
  title: 'Calendar - Time Block Your Tasks',
  description: 'Visual calendar to time block and schedule your tasks',
}

export default async function CalendarPage() {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

  const [scheduledTasks, unscheduledTasks] = await Promise.all([
    getScheduledTasks(weekStart, weekEnd),
    getUnscheduledTasks()
  ])

  return (
    <div className="flex flex-col h-screen">
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">
          Time block your tasks and visualize your week
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <CalendarView 
          initialScheduledTasks={scheduledTasks} 
          initialUnscheduledTasks={unscheduledTasks}
        />
      </div>
    </div>
  )
}
