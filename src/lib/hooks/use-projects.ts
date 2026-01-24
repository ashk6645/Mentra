import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, getProject, createProject, updateProject, deleteProject, type CreateProjectInput } from '@/lib/actions/projects'
import { queryKeys } from '@/lib/react-query'
import { showErrorToast, showSuccessToast } from '@/lib/error-handler'

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: async () => {
      const projects = await getProjects()
      return projects
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: async () => {
      const project = await getProject(id)
      if (!project) {
        throw new Error('Project not found')
      }
      return project
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const result = await createProject(data)
      if (!result.success) {
        throw new Error(result.error as string)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      showSuccessToast('Project created', 'Your project has been created successfully')
    },
    onError: (error: Error) => {
      showErrorToast(error.message, 'Create project')
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProjectInput> }) => {
      const result = await updateProject(id, data)
      if (!result.success) {
        throw new Error(result.error as string)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.id) })
      showSuccessToast('Project updated', 'Your project has been updated successfully')
    },
    onError: (error: Error) => {
      showErrorToast(error.message, 'Update project')
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteProject(id)
      if (!result.success) {
        throw new Error(result.error as string)
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      showSuccessToast('Project deleted', 'Project has been removed')
    },
    onError: (error: Error) => {
      showErrorToast(error.message, 'Delete project')
    },
  })
}
