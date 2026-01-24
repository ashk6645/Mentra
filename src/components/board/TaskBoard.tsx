"use client"

import { useState } from "react";
import { Task } from "@prisma/client";
import { TaskBoardColumn } from "./TaskBoardColumn";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";

interface Section {
  id: string;
  name: string;
}

interface TaskBoardProps {
  tasks: any[]; // Extended task
  sections?: Section[];
  projectId: string;
  onTaskCreated?: (task: Task) => void;
}

export function TaskBoard({ tasks, sections = [], projectId, onTaskCreated }: TaskBoardProps) {
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
          onAddTask={() => setShowCreateForSection(col.id)}
        >
          {showCreateForSection === col.id && (
            <CreateTaskDialog
              open={true}
              projectId={projectId}
              defaultSectionId={col.id === 'uncategorized' ? undefined : col.id}
              onOpenChange={() => setShowCreateForSection(null)}
              onTaskCreated={onTaskCreated}
              trigger={<></>}
            />
          )}
        </TaskBoardColumn>
      ))}
    </div>
  );
}
// Note: CreateTaskDialog needs to support 'defaultSectionId' if we want this to work perfectly.
// Currently CreateTaskDialog supports `defaultStatus` which was mapped to... nothing?
// We need to check CreateTaskDialog again.
