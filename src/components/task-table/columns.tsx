import type { ColumnDef } from '@/components/data-table'
import { CreatedCell, DoneCell, DueCell, LabelsCell, PriorityCell, SectionCell, SubtasksCell, TitleCell } from './cells'
import { priorityRank } from './due-date'
import type { TaskColumnId, TaskTableTask } from './types'

/**
 * Every column the task table can show, defined once at module level.
 *
 * Static on purpose: a column's `cell` reads what it needs from context, so the
 * definitions never change identity and memoised rows never re-render for no
 * reason. Sections sort in the project's own order, which the table injects.
 */

const time = (value: Date | string | null | undefined) => (value ? new Date(value).getTime() : null)

export const TASK_COLUMNS: (ColumnDef<TaskTableTask> & { id: TaskColumnId })[] = [
    {
        id: 'done',
        header: '',
        label: 'Done',
        width: 44,
        align: 'center',
        cell: task => <DoneCell task={task} />,
    },
    {
        id: 'title',
        header: 'Task',
        width: 'fill',
        minWidth: 260,
        sortValue: task => task.title,
        cell: task => <TitleCell task={task} />,
    },
    {
        id: 'due',
        header: 'Due',
        width: 168,
        sortValue: task => time(task.dueDate),
        defaultDirection: 'asc',
        hideable: true,
        cell: task => <DueCell task={task} />,
    },
    {
        id: 'priority',
        header: 'Priority',
        width: 124,
        // No priority sorts last, like any missing value.
        sortValue: task => priorityRank(task.priority) || null,
        defaultDirection: 'desc',
        hideable: true,
        cell: task => <PriorityCell task={task} />,
    },
    {
        id: 'section',
        header: 'Section',
        width: 160,
        hideable: true,
        cell: task => <SectionCell task={task} />,
    },
    {
        id: 'labels',
        header: 'Labels',
        width: 196,
        sortValue: task => task.tags?.length || null,
        defaultDirection: 'desc',
        hideable: true,
        cell: task => <LabelsCell task={task} />,
    },
    {
        id: 'subtasks',
        header: 'Subtasks',
        width: 112,
        sortValue: task => (task.subtasks?.length ? task.subtasks.filter(s => s.completed).length / task.subtasks.length : null),
        defaultDirection: 'desc',
        hideable: true,
        cell: task => <SubtasksCell task={task} />,
    },
    {
        id: 'created',
        header: 'Created',
        width: 112,
        sortValue: task => time(task.createdAt),
        defaultDirection: 'desc',
        hideable: true,
        cell: task => <CreatedCell task={task} />,
    },
]

/** Hidden until asked for — useful, but not what you scan a project for. */
export const DEFAULT_HIDDEN: TaskColumnId[] = ['created']
