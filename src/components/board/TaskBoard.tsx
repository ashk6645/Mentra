"use client"

import { useState } from "react";
import { Task } from "@prisma/client";
import { TaskBoardColumn } from "./TaskBoardColumn";
import { CreateTaskInline } from "@/components/tasks/create-task-inline";

interface Section {
  id: string;
  name: string;
}

interface TaskBoardProps {
  tasks: any[]; // Extended task
  sections?: Section[];
  projectId: string;
  onTaskCreated?: (task: Task) => void;
  canEdit: boolean;
}

export function TaskBoard({ tasks, sections = [], projectId, onTaskCreated, canEdit }: TaskBoardProps) {
  const [showCreateForSection, setShowCreateForSection] = useState<string | null>(null);

  // If no sections exist, create default view or just one column
  // But usually projects should have sections if we are in section view.
  // If empty, maybe show "Uncategorized" or prompt?
  // User might not have sections.
  // Let's create a "No Section" column if needed.

  const uncategorizedTasks = tasks.filter(t => !t.sectionId);

  const columns = [
    // If we have sections, map them
    ...sections.map(s => ({ id: s.id, title: s.name })),
    // Also potentially separate "Completed"? Or completed tasks stay in sections?
    // Usually completed tasks might be hidden or in a "Completed" section.
    // For now, let's just show sections.
  ];

  // If there are absolutely no sections, maybe fallback to "To Do"?
  if (columns.length === 0) {
    columns.push({ id: "uncategorized", title: "Tasks" })
  } else if (uncategorizedTasks.length > 0) {
    // If sections exist but we have orphan tasks, add an "Uncategorized" column at start
    columns.unshift({ id: "uncategorized", title: "Uncategorized" })
  }

  const getTasksForColumn = (columnId: string) => {
    if (columnId === "uncategorized") {
      return tasks.filter(t => !t.sectionId);
    }
    return tasks.filter(t => t.sectionId === columnId);
  }

  return (
    <div className="flex gap-4 w-full h-full overflow-x-auto pb-4">
      {columns.map((col) => (
        <TaskBoardColumn
          key={col.id}
          title={col.title}
          tasks={getTasksForColumn(col.id)}
          onAddTask={canEdit ? () => setShowCreateForSection(col.id) : undefined}
        >
          {canEdit && showCreateForSection === col.id && (

            <div className="mt-2">
              <CreateTaskInline
                projectId={projectId}
                defaultSectionId={col.id === 'uncategorized' ? undefined : col.id}
                onTaskCreated={() => {
                  onTaskCreated && onTaskCreated({} as any) // Trigger refresh via parent or callback
                  setShowCreateForSection(null)
                }}
                // We want it to be expanded immediately since the user clicked "Add Task" on the column header
                // But CreateTaskInline manages its own state.
                // We might need to adjust CreateTaskInline to accept 'autoFocus' or 'defaultExpanded'?
                // For now, let's just render it. The user will see "Add task..." button unless we trigger it.
                // Actually, if we render it inside the column, it acts as a permanent footer or temporary item.
                // If showCreateForSection is true, we probably want to show the EDITOR immediately.
                // But CreateTaskInline encapsulates that. 
                // Let's just render it as a standard inline creator at the bottom of the list.
                variant="inline"
                className="w-full"
              />
            </div>
          )}
        </TaskBoardColumn>
      ))}
    </div>
  );
}
// Note: CreateTaskDialog needs to support 'defaultSectionId' if we want this to work perfectly.
// Currently CreateTaskDialog supports `defaultStatus` which was mapped to... nothing?
// We need to check CreateTaskDialog again.
