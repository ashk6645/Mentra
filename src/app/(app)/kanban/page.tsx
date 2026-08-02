import { KanbanBoard } from '@/components/kanban/kanban-board'

export const metadata = {
    title: 'Kanban Board – Mentra',
}

export default function KanbanPage() {
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="w-full">
                <div className="max-w-5xl mx-auto px-5 pt-10 pb-6 sm:px-6 sm:pt-12">
                    <h1 className="text-[32px] font-bold tracking-tight leading-tight text-foreground">
                        Kanban Board (Demo)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Drag cards between columns to track progress.
                    </p>
                </div>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-5 pb-12 sm:px-6">
                    <KanbanBoard />
                </div>
            </div>
        </div>
    )
}
