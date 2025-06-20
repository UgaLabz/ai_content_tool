import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useCharacters,
  useCharacter,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
  useDuplicateCharacter,
} from '../useCharacters'
import { characterService } from '@/services/api/characters'
import type { Character } from '@/types/api.types'

// Mock the character service
vi.mock('@/services/api/characters', () => ({
  characterService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock toast hook
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

// Mock character data
const mockCharacter: Character = {
  id: '1',
  name: 'Test Character',
  personality: {
    traits: ['friendly'],
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
  catchphrases: [],
  stats: {
    totalGenerations: 0,
    consistencyScore: 100,
    popularityScore: 0,
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useCharacters hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useCharacters', () => {
    it('should fetch all characters', async () => {
      const mockCharacters = [mockCharacter]
      vi.mocked(characterService.getAll).mockResolvedValue(mockCharacters)

      const { result } = renderHook(() => useCharacters(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCharacters)
      expect(characterService.getAll).toHaveBeenCalledTimes(1)
    })

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch')
      vi.mocked(characterService.getAll).mockRejectedValue(error)

      const { result } = renderHook(() => useCharacters(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })
  })

  describe('useCharacter', () => {
    it('should fetch single character', async () => {
      vi.mocked(characterService.getById).mockResolvedValue(mockCharacter)

      const { result } = renderHook(() => useCharacter('1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCharacter)
      expect(characterService.getById).toHaveBeenCalledWith('1')
    })

    it('should not fetch when id is undefined', () => {
      const { result } = renderHook(() => useCharacter(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(false)
      expect(result.current.isSuccess).toBe(false)
      expect(characterService.getById).not.toHaveBeenCalled()
    })
  })

  describe('useCreateCharacter', () => {
    it('should create character successfully', async () => {
      const newCharacter = { ...mockCharacter, id: '2' }
      vi.mocked(characterService.create).mockResolvedValue(newCharacter)

      const { result } = renderHook(() => useCreateCharacter(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync({
        name: 'New Character',
        personality: mockCharacter.personality,
        voice: mockCharacter.voice,
      })

      expect(characterService.create).toHaveBeenCalledWith({
        name: 'New Character',
        personality: mockCharacter.personality,
        voice: mockCharacter.voice,
      })
    })

    it('should handle creation error', async () => {
      const error = new Error('Failed to create')
      vi.mocked(characterService.create).mockRejectedValue(error)

      const { result } = renderHook(() => useCreateCharacter(), {
        wrapper: createWrapper(),
      })

      await expect(
        result.current.mutateAsync({
          name: 'New Character',
          personality: mockCharacter.personality,
          voice: mockCharacter.voice,
        })
      ).rejects.toThrow('Failed to create')
    })
  })

  describe('useUpdateCharacter', () => {
    it('should update character optimistically', async () => {
      const updatedCharacter = { ...mockCharacter, name: 'Updated Name' }
      vi.mocked(characterService.update).mockResolvedValue(updatedCharacter)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      // Pre-populate cache
      queryClient.setQueryData(['characters', 'list'], [mockCharacter])

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useUpdateCharacter(), { wrapper })

      await result.current.mutateAsync({
        id: '1',
        data: { name: 'Updated Name' },
      })

      // Check optimistic update
      const cachedData = queryClient.getQueryData(['characters', 'list']) as Character[]
      expect(cachedData[0].name).toBe('Updated Name')

      await waitFor(() => {
        expect(characterService.update).toHaveBeenCalledWith('1', { name: 'Updated Name' })
      })
    })

    it('should rollback on error', async () => {
      const error = new Error('Failed to update')
      vi.mocked(characterService.update).mockRejectedValue(error)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      // Pre-populate cache
      queryClient.setQueryData(['characters', 'list'], [mockCharacter])

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useUpdateCharacter(), { wrapper })

      await result.current.mutateAsync({
        id: '1',
        data: { name: 'Updated Name' },
      }).catch(() => {
        // Expected error
      })

      // Check rollback
      await waitFor(() => {
        const cachedData = queryClient.getQueryData(['characters', 'list']) as Character[]
        expect(cachedData[0].name).toBe('Test Character')
      })
    })
  })

  describe('useDeleteCharacter', () => {
    it('should delete character optimistically', async () => {
      vi.mocked(characterService.delete).mockResolvedValue()

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      // Pre-populate cache
      const characters = [mockCharacter, { ...mockCharacter, id: '2' }]
      queryClient.setQueryData(['characters', 'list'], characters)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useDeleteCharacter(), { wrapper })

      await result.current.mutateAsync('1')

      // Check optimistic delete
      const cachedData = queryClient.getQueryData(['characters', 'list']) as Character[]
      expect(cachedData).toHaveLength(1)
      expect(cachedData[0].id).toBe('2')

      await waitFor(() => {
        expect(characterService.delete).toHaveBeenCalledWith('1')
      })
    })
  })

  describe('useDuplicateCharacter', () => {
    it('should duplicate character', async () => {
      const duplicatedCharacter = { ...mockCharacter, id: '2', name: 'Test Character (Copy)' }
      vi.mocked(characterService.getById).mockResolvedValue(mockCharacter)
      vi.mocked(characterService.create).mockResolvedValue(duplicatedCharacter)

      const { result } = renderHook(() => useDuplicateCharacter(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync('1')

      expect(characterService.getById).toHaveBeenCalledWith('1')
      expect(characterService.create).toHaveBeenCalledWith({
        name: 'Test Character (Copy)',
        avatar: mockCharacter.avatar,
        personality: mockCharacter.personality,
        voice: mockCharacter.voice,
        background: mockCharacter.background,
        relationships: [],
        catchphrases: [],
      })
    })
  })
})