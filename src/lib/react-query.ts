import { QueryClient, DefaultOptions } from '@tanstack/react-query'

const queryConfig: DefaultOptions = {
  queries: {
    // Stale time: Data is considered fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache time: Keep unused data in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry failed requests 1 time
    retry: 1,
    // Refetch on window focus for real-time updates
    refetchOnWindowFocus: true,
    // Don't refetch on mount if data is fresh
    refetchOnMount: false,
    // Refetch on reconnect
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry failed mutations once
    retry: 1,
  },
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: queryConfig,
  })
}

// Query keys for consistent cache management
export const queryKeys = {
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
  },
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },
  // Habits
  habits: {
    all: ['habits'] as const,
    lists: () => [...queryKeys.habits.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.habits.lists(), filters] as const,
    details: () => [...queryKeys.habits.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.habits.details(), id] as const,
  },
  // Areas
  areas: {
    all: ['areas'] as const,
    lists: () => [...queryKeys.areas.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.areas.lists(), filters] as const,
    details: () => [...queryKeys.areas.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.areas.details(), id] as const,
  },
  // Tags
  tags: {
    all: ['tags'] as const,
    lists: () => [...queryKeys.tags.all, 'list'] as const,
  },
  // Profile
  profile: {
    all: ['profile'] as const,
    current: () => [...queryKeys.profile.all, 'current'] as const,
    stats: () => [...queryKeys.profile.all, 'stats'] as const,
  },
}
