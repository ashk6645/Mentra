import { createClient } from '@/lib/supabase/server'
import { getCompletedTasks } from '@/lib/actions/completed-actions'
import { CompletedHeader } from '@/components/completed/completed-header'
import { CompletedTaskList } from '@/components/completed/completed-task-list'

export const dynamic = 'force-dynamic'

export default async function CompletedPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const result = await getCompletedTasks()
    const groupedTasks = result.success && result.data ? result.data : { today: [], yesterday: [], older: {} }

    return (
        <div className="flex-1 overflow-y-auto bg-muted/5 min-h-full">
            <div className="max-w-3xl mx-auto px-6 pb-20 pt-8">
                <CompletedHeader />

                <div className="mt-8">
                    <CompletedTaskList groupedTasks={groupedTasks} />
                </div>
            </div>
        </div>
    )
}
