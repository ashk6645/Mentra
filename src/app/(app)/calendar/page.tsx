import { getTasks } from '@/lib/actions/tasks'
import { CalendarWrapper } from '@/components/calendar/calendar-wrapper'

export const metadata = {
  title: 'Calendar - Time Block Your Tasks',
  description: 'Visual calendar to time block and schedule your tasks',
}

export default async function CalendarPage() {
  const result = await getTasks()
  const tasks = result.success && result.data ? result.data : []

  // Separate tasks if needed, for new architecture we might just pass all tasks
  // and let the view filter. The previous implementation separated scheduled/unscheduled.
  // For this premium view, we primarily focus on scheduled tasks on the calendar.

  const scheduledTasks = tasks.filter((t: any) => t.dueDate)
  const unscheduledTasks = tasks.filter((t: any) => !t.dueDate)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <CalendarWrapper
        initialScheduledTasks={scheduledTasks}
        initialUnscheduledTasks={unscheduledTasks}
      />
    </div>
  )
}
