import { createClient } from '@/lib/supabase/server'
import { TaskSelectionToggle } from '@/components/tasks/task-selection-toggle'
import { getCompletedTasks } from '@/lib/actions/completed-actions'
import { PageShell } from '@/components/layout/page-shell'
import { PageHeader } from '@/components/layout/page-header'
import { CheckCircle2 } from 'lucide-react'
import { CompletedTaskList } from '@/components/completed/completed-task-list'

export const dynamic = 'force-dynamic'

export default async function CompletedPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const result = await getCompletedTasks()
    const groupedTasks = result.success && result.data ? result.data : { today: [], yesterday: [], older: {} }

    return (
        <PageShell>
            <PageHeader
                title="Completed"
                description="Your accomplishment history"
                icon={CheckCircle2}
                actions={<TaskSelectionToggle taskIds={[
                    ...groupedTasks.today,
                    ...groupedTasks.yesterday,
                    ...Object.values(groupedTasks.older).flat()
                ].map((t: any) => t.id)} />}
            />

            <div className="space-y-8">
                <CompletedTaskList groupedTasks={groupedTasks} />
            </div>
        </PageShell>
    )
}
