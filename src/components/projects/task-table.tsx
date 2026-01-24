"use client"

import React from 'react'
import { Task } from '@prisma/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Calendar, Flag, Pencil, Trash } from 'lucide-react'
import { format } from 'date-fns'
import { toggleTaskCompletion, deleteTask } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'
import { EditTaskDialog } from '@/components/tasks/edit-task-dialog'

interface TaskTableProps {
    tasks: any[] // Task & { tags, etc }
}

export function TaskTable({ tasks }: TaskTableProps) {
    const router = useRouter()

    const handleToggle = async (id: string, checked: boolean) => {
        await toggleTaskCompletion(id, checked)
        router.refresh()
    }

    const handleDelete = async (id: string) => {
        await deleteTask(id)
        router.refresh()
    }

    // Sort tasks: Incomplete first, then by due date
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed === b.completed) {
            if (!a.dueDate) return 1
            if (!b.dueDate) return -1
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        return a.completed ? 1 : -1
    })

    return (
        <div className="rounded-md border border-border/40 overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/10">
                    <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[120px]">Priority</TableHead>
                        <TableHead className="w-[140px]">Due Date</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTasks.map((task) => (
                        <TableRow key={task.id} className="group hover:bg-muted/10 transition-colors">
                            <TableCell>
                                <Checkbox
                                    checked={task.completed}
                                    onCheckedChange={(c) => handleToggle(task.id, c as boolean)}
                                />
                            </TableCell>
                            <TableCell className="font-medium">
                                <div className={task.completed ? "line-through text-muted-foreground" : ""}>
                                    {task.title}
                                </div>
                                {task.description && (
                                    <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                        {task.description}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant={task.completed ? "outline" : "secondary"} className="text-xs font-normal">
                                    {task.completed ? "Completed" : "In Progress"}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {task.priority && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                                        <Flag className="w-3.5 h-3.5" />
                                        {task.priority.toLowerCase()}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                {task.dueDate ? (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground/50">-</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <EditTaskDialog
                                            task={task}
                                            trigger={
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                            }
                                        />
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(task.id)}>
                                            <Trash className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {sortedTasks.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No tasks found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
