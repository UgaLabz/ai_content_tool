import { QueryClient } from '@tanstack/react-query'
import type { QueryClientConfig } from '@tanstack/react-query'

const queryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time: How long before data is considered stale
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // Cache time: How long to keep data in cache after component unmounts
      gcTime: 1000 * 60 * 30, // 30 minutes
      
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      
      // Refetch on window focus
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
}

export const queryClient = new QueryClient(queryConfig)

// Query keys factory
export const queryKeys = {
  all: ['characters'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => 
    [...queryKeys.lists(), filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
  
  // Generation keys
  generations: ['generations'] as const,
  generationList: (characterId?: string) => 
    [...queryKeys.generations, 'list', characterId] as const,
    
  // Template keys
  templates: ['templates'] as const,
  templateList: () => [...queryKeys.templates, 'list'] as const,
  templateDetail: (id: string) => [...queryKeys.templates, 'detail', id] as const,
}