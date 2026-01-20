"use client"

import { ReactNode } from "react";
import { Task } from "@prisma/client";
import { TaskCard } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TaskBoardColumnProps {
  title: string;
  tasks: Task[];
  onAddTask?: () => void;
  onTaskDrop?: (taskId: string) => void;
  children?: ReactNode;
}

export function TaskBoardColumn({
  title,
  tasks,
  onAddTask,
  onTaskDrop,
  children,
}: TaskBoardColumnProps) {
  return (
    <div className="flex flex-col w-80 bg-muted/10 rounded-lg border p-3 min-h-[300px]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-base">{title}</span>
        {onAddTask && (
          <Button size="icon" variant="ghost" onClick={onAddTask}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1 space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {children}
      </div>
    </div>
  );
}
