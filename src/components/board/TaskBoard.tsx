"use client"

import { useState } from "react";
import { Task } from "@prisma/client";
import { TaskBoardColumn } from "./TaskBoardColumn";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";

const STATUS = [
  { key: "COMPLETED", label: "Completed" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "NOT_STARTED", label: "Not Started" },
  { key: "PLANNING", label: "Planning" },
];

interface TaskBoardProps {
  tasks: Task[];
  onTaskCreated?: (task: Task) => void;
}

export function TaskBoard({ tasks, onTaskCreated }: TaskBoardProps) {
  const [showCreate, setShowCreate] = useState<string | null>(null);

  const getTasksByStatus = (status: string) =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="flex gap-4 w-full overflow-x-auto">
      {STATUS.map((col) => (
        <TaskBoardColumn
          key={col.key}
          title={col.label}
          tasks={getTasksByStatus(col.key)}
          onAddTask={() => setShowCreate(col.key)}
        >
          {showCreate === col.key && (
            <CreateTaskDialog
              open={true}
              defaultStatus={col.key}
              onOpenChange={() => setShowCreate(null)}
              onTaskCreated={onTaskCreated}
            />
          )}
        </TaskBoardColumn>
      ))}
    </div>
  );
}
