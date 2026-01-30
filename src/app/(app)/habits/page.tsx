import { getHabits } from '@/lib/actions/habits'
import { HabitsView } from '@/components/habits/habits-view'

export const dynamic = 'force-dynamic'

export default async function HabitsPage() {
    const habitsResult = await getHabits()
    const habits = habitsResult.success ? habitsResult.data : []

    return <HabitsView habits={habits} />
}
