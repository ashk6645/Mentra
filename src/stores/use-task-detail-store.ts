import { create } from 'zustand'

interface TaskDetailStore {
  selectedTaskId: string | null
  selectedTask: any | null
  isOpen: boolean
  isReadOnly: boolean
  selectTask: (taskId: string | null, task?: any) => void
  closePanel: () => void
}

export const useTaskDetailStore = create<TaskDetailStore>((set) => ({
  selectedTaskId: null,
  selectedTask: null,
  isOpen: false,
  isReadOnly: false,
  selectTask: (taskId, task) => set({
    selectedTaskId: taskId,
    selectedTask: task || null,
    isOpen: !!taskId,
    isReadOnly: task?.completed || false
  }),
  closePanel: () => set({ selectedTaskId: null, selectedTask: null, isOpen: false, isReadOnly: false }),
}))
