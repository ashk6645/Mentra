import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getHabits, createHabit, completeHabit, deleteHabit } from '@/lib/actions/habits'
import { queryKeys } from '@/lib/react-query'
import { showErrorToast, showSuccessToast } from '@/lib/error-handler'

export function useHabits() {
  return useQuery({
    queryKey: queryKeys.habits.lists(),
    queryFn: async () => {
      const result = await getHabits()
      if (!result.success) {
        throw new Error(result.error as string)
      }
      return result.data
    },
  })
}

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; frequency: 'daily' | 'weekly' | 'monthly' }) => {
      const result = await createHabit(data)
      if (!result.success) {
        throw new Error(result.error as string)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all })
      showSuccessToast('Habit created', 'Your habit has been created successfully')
    },
    onError: (error: Error) => {
      showErrorToast(error.message, 'Create habit')
    },
  })
}

export function useCompleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habitId: string) => {
      const result = await completeHabit(habitId)
      if (!result.success) {
        throw new Error(result.error as string)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all })
      showSuccessToast('Habit completed', 'Great job! Keep building that streak!')
    },
    onError: (error: Error) => {
      showErrorToast(error.message, 'Complete habit')
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habitId: string) => {
      const result = await deleteHabit(habitId)
      if (!result.success) {
        throw new Error(result.error as string)
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all })
      showSuccessToast('Habit deleted', 'Habit has been removed')
    },
    onError: (error: Error) => {
      showErrorToast(error.message, 'Delete habit')
    },
  })
}
