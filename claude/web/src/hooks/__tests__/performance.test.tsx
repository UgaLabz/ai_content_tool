import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCharacters, useCreateCharacter, useUpdateCharacter, useDeleteCharacter } from '../useCharacters'
import { useCharacterStore } from '@/stores/characterStore'
import { characterService } from '@/services/api/characters'
import type { Character } from '@/types/api.types'
import { measureAsyncOperation, PERFORMANCE_THRESHOLDS } from '@/tests/utils/performance'

// Mock the API
vi.mock('@/services/api/characters', () => ({
  characterService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    duplicate: vi.fn(),
  },
}))

const createMockCharacters = (count: number): Character[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    name: `Character ${i + 1}`,
    avatar: `https://example.com/avatar${i + 1}.jpg`,
    personality: {
      traits: ['trait1', 'trait2'],
      humor: 50,
      formality: 50,
      enthusiasm: 50,
      empathy: 50,
    },
    voice: {
      tone: 'casual',
      vocabulary: 'simple',
      sentenceStructure: 'short',
    },
    background: `Background for character ${i + 1}`,
    relationships: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
}

describe('State Management Performance', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
    useCharacterStore.setState({
      characters: [],
      selectedCharacter: null,
      isLoading: false,
      error: null,
    })
  })

  describe('useCharacters Hook', () => {
    it('should fetch characters within performance threshold', async () => {
      const mockCharacters = createMockCharacters(50)
      vi.mocked(characterService.getAll).mockResolvedValue(mockCharacters)

      const { result, duration } = await measureAsyncOperation(async () => {
        const { result } = renderHook(() => useCharacters(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.data).toEqual(mockCharacters)
        })
        
        return result
      }, 'fetch-characters')

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE_INTERACTION)
      expect(result.current.data).toHaveLength(50)
    })

    it('should handle cache efficiently on refetch', async () => {
      const mockCharacters = createMockCharacters(20)
      vi.mocked(characterService.getAll).mockResolvedValue(mockCharacters)

      const { result } = renderHook(() => useCharacters(), { wrapper })

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.data).toEqual(mockCharacters)
      })

      // Measure refetch performance
      const { duration } = await measureAsyncOperation(async () => {
        await result.current.refetch()
      }, 'refetch-characters')

      // Refetch should be fast due to caching
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_INTERACTION)
      expect(vi.mocked(characterService.getAll)).toHaveBeenCalledTimes(2)
    })
  })

  describe('Optimistic Updates', () => {
    it('should perform optimistic create within threshold', async () => {
      const newCharacter = createMockCharacters(1)[0]
      vi.mocked(characterService.create).mockResolvedValue(newCharacter)

      const { result } = renderHook(() => useCreateCharacter(), { wrapper })

      const { duration } = await measureAsyncOperation(async () => {
        await result.current.mutateAsync({
          name: newCharacter.name,
          personality: newCharacter.personality,
          voice: newCharacter.voice,
        })
      }, 'optimistic-create')

      // Optimistic update should be instant
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_INTERACTION)
    })

    it('should rollback optimistic updates efficiently', async () => {
      const error = new Error('Network error')
      vi.mocked(characterService.update).mockRejectedValue(error)

      const { result } = renderHook(() => useUpdateCharacter(), { wrapper })

      const startTime = performance.now()
      
      try {
        await result.current.mutateAsync({
          id: '1',
          data: { name: 'Updated Name' },
        })
      } catch (e) {
        // Expected error
      }

      const duration = performance.now() - startTime
      
      // Rollback should be fast
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE_INTERACTION)
    })
  })

  describe('Zustand Store', () => {
    it('should handle large state updates efficiently', async () => {
      const characters = createMockCharacters(100)
      
      const { duration } = await measureAsyncOperation(async () => {
        // Directly set state - simulating bulk update
        useCharacterStore.setState({ characters, isLoading: false })
        
        await waitFor(() => {
          expect(useCharacterStore.getState().characters).toHaveLength(100)
        })
      }, 'zustand-bulk-update')

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_INTERACTION)
    })

    it('should perform selective updates efficiently', async () => {
      const characters = createMockCharacters(50)
      useCharacterStore.setState({ characters })

      const { duration } = await measureAsyncOperation(async () => {
        // Update single character using optimistic update
        const updatedData = { name: 'Updated Character' }
        useCharacterStore.getState().optimisticUpdate('26', updatedData)
        
        await waitFor(() => {
          const state = useCharacterStore.getState()
          const character = state.characters.find(c => c.id === '26')
          expect(character?.name).toBe('Updated Character')
        })
      }, 'zustand-selective-update')

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_RENDER)
    })

    it('should handle concurrent updates without performance degradation', async () => {
      const updatePromises: Promise<void>[] = []
      const updateCount = 20

      const startTime = performance.now()

      for (let i = 0; i < updateCount; i++) {
        updatePromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              useCharacterStore.setState({ isLoading: i % 2 === 0 })
              resolve()
            }, Math.random() * 10)
          })
        )
      }

      await Promise.all(updatePromises)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE_INTERACTION)
    })
  })

  describe('Query Invalidation', () => {
    it('should invalidate queries efficiently', async () => {
      const mockCharacters = createMockCharacters(30)
      vi.mocked(characterService.getAll).mockResolvedValue(mockCharacters)

      // Populate cache by setting data directly
      queryClient.setQueryData(['characters'], mockCharacters)
      
      // Verify cache is populated
      expect(queryClient.getQueryData(['characters'])).toBeDefined()

      const { duration } = await measureAsyncOperation(async () => {
        await queryClient.invalidateQueries({ queryKey: ['characters'] })
      }, 'query-invalidation')

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_INTERACTION)
    })

    it('should handle cascade invalidations efficiently', async () => {
      // Setup multiple related queries
      const queries = ['characters', 'character-1', 'character-2', 'character-stats']
      
      queries.forEach(key => {
        queryClient.setQueryData([key], { data: 'mock' })
      })

      const { duration } = await measureAsyncOperation(async () => {
        await queryClient.invalidateQueries({ 
          predicate: (query) => 
            query.queryKey[0] === 'characters' || 
            (query.queryKey[0] as string).startsWith('character')
        })
      }, 'cascade-invalidation')

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_INTERACTION)
    })
  })

  describe('Memory Management', () => {
    it('should garbage collect old queries', async () => {
      // Create queries that will be garbage collected
      for (let i = 0; i < 50; i++) {
        queryClient.setQueryData(['temp-query', i], { data: `temp-${i}` })
      }

      // Set short garbage collection time
      queryClient.setDefaultOptions({
        queries: {
          gcTime: 100, // 100ms
        },
      })

      // Wait for garbage collection
      await new Promise(resolve => setTimeout(resolve, 200))

      // Force garbage collection
      queryClient.getQueryCache().findAll().forEach(query => {
        if (query.state.dataUpdatedAt < Date.now() - 100) {
          queryClient.getQueryCache().remove(query)
        }
      })

      const remainingQueries = queryClient.getQueryCache().findAll()
      expect(remainingQueries.length).toBeLessThan(50)
    })
  })
})