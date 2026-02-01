import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, createTask, updateTask, deleteTask, toggleTaskCompletion, type GetTasksOptions, type CreateTaskInput, type UpdateTaskInput } from '@/lib/actions/tasks'
import { queryKeys } from '@/lib/react-query'
import { showErrorToast, showSuccessToast } from '@/lib/error-handler'

export function useTasks(options: GetTasksOptions = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(options),
    queryFn: async () => {
      const result = await getTasks(options)
      if (!result.success) {
        throw new Error(result.error as string)
      }
      return result.data
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const result = await createTask(data)
      if (!result.success) {
        throw new Error(result.error as string)
      }
      return result.data
    },
    onSuccess: () => {
      // Invalidate all task queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      showSuccessToast('Task created', 'Your task has been created successfully')
    },
    onError: (error: Error) => {
      showErrorToast(error.message, 'Create task')
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateTaskInput) => {
      const result = await updateTask(data)
      if (!result.success) {
        throw new Error(result.error as string)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      showSuccessToast('Task updated', 'Your task has been updated successfully')
    },
    onError: (error: Error) => {
      showErrorToast(error.message, 'Update task')
    },
  })
}

export function useToggleTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const result = await toggleTaskCompletion(id, completed)
      if (!result.success) {
        throw new Error(result.error as string)
      }
      return result.data
    },
    // Optimistic updates for instant UI feedback
    onMutate: async ({ id, completed }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })
      
      // Snapshot previous values
      const previousTasks = queryClient.getQueriesData({ queryKey: queryKeys.tasks.all })
      
      // Optimistically update all task queries
      queryClient.setQueriesData({ queryKey: queryKeys.tasks.all }, (old: any) => {
        if (!old) return old
        if (Array.isArray(old)) {
          return old.map((task: any) => 
            task.id === id 
              ? { ...task, completed, completedAt: completed ? new Date().toISOString() : null }
              : task
          )
        }
        return old
      })
      
      // Return context for rollback
      return { previousTasks }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      if (variables.completed) {
        showSuccessToast('Task completed', 'Great job! Keep up the momentum!')
      }
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      showErrorToast(error.message, 'Toggle task')
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTask(id)
      if (!result.success) {
        throw new Error(result.error as string)
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      showSuccessToast('Task deleted', 'Task has been removed')
    },
    onError: (error: Error) => {
      showErrorToast(error.message, 'Delete task')
    },
  })
}
