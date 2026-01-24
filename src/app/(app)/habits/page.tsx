import { getHabits } from '@/lib/actions/habits'
import { CreateHabitDialog } from '@/components/habits/create-habit-dialog'
import { HabitCard } from '@/components/habits/habit-card'
import { Target } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HabitsPage() {
    const habitsResult = await getHabits()
    const habits = habitsResult.success ? habitsResult.data : []

    return (
        <div className="flex flex-col h-full p-8 space-y-8 overflow-y-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
                    <p className="text-muted-foreground mt-1">
                        Build consistent daily routines
                    </p>
                </div>
                <CreateHabitDialog />
            </div>

            <div className="space-y-4">
                {habits.map(habit => (
                    <HabitCard key={habit.id} habit={habit} />
                ))}

                {habits.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                        <Target className="h-12 w-12 mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold">No Habits Yet</h3>
                        <p className="max-w-sm mx-auto mt-2">
                            Create your first habit to start building better routines.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
