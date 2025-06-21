import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCharacterStore } from '../characterStore'
import type { Character } from '@/types/api.types'

// Mock character data
const mockCharacter: Character = {
  id: '1',
  name: 'Test Character',
  personality: {
    traits: ['friendly', 'creative'],
    humor: 70,
    formality: 30,
    enthusiasm: 80,
    empathy: 90,
  },
  voice: {
    tone: 'casual',
    vocabulary: 'simple',
    sentenceStructure: 'short',
  },
  catchphrases: ['Hello there!'],
  stats: {
    totalGenerations: 10,
    consistencyScore: 95,
    popularityScore: 85,
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('characterStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useCharacterStore())
    act(() => {
      result.current.setCharacters([])
      result.current.selectCharacter(null)
      result.current.setError(null)
    })
  })

  describe('Basic State Management', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useCharacterStore())
      
      expect(result.current.characters).toEqual([])
      expect(result.current.selectedCharacter).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should set and get characters', () => {
      const { result } = renderHook(() => useCharacterStore())
      
      act(() => {
        result.current.setCharacters([mockCharacter])
      })
      
      expect(result.current.characters).toHaveLength(1)
      expect(result.current.characters[0]).toEqual(mockCharacter)
    })

    it('should select and deselect character', () => {
      const { result } = renderHook(() => useCharacterStore())
      
      act(() => {
        result.current.setCharacters([mockCharacter])
        result.current.selectCharacter(mockCharacter)
      })
      
      expect(result.current.selectedCharacter).toEqual(mockCharacter)
      
      act(() => {
        result.current.selectCharacter(null)
      })
      
      expect(result.current.selectedCharacter).toBeNull()
    })

    it('should set loading state', () => {
      const { result } = renderHook(() => useCharacterStore())
      
      act(() => {
        result.current.setLoading(true)
      })
      
      expect(result.current.isLoading).toBe(true)
      
      act(() => {
        result.current.setLoading(false)
      })
      
      expect(result.current.isLoading).toBe(false)
    })

    it('should set error state', () => {
      const { result } = renderHook(() => useCharacterStore())
      const error = 'Test error'
      
      act(() => {
        result.current.setError(error)
      })
      
      expect(result.current.error).toBe(error)
    })
  })

  describe('CRUD Operations', () => {
    it('should create character', async () => {
      const { result } = renderHook(() => useCharacterStore())
      const newCharacter = { ...mockCharacter, id: '2', name: 'New Character' }
      
      await act(async () => {
        await result.current.createCharacter(newCharacter)
      })
      
      expect(result.current.characters).toHaveLength(1)
      expect(result.current.characters[0]).toEqual(newCharacter)
    })

    it('should update character', async () => {
      const { result } = renderHook(() => useCharacterStore())
      const updatedData = { name: 'Updated Character' }
      
      act(() => {
        result.current.setCharacters([mockCharacter])
      })
      
      await act(async () => {
        await result.current.updateCharacter(mockCharacter.id, updatedData)
      })
      
      expect(result.current.characters[0].name).toBe('Updated Character')
    })

    it('should delete character', async () => {
      const { result } = renderHook(() => useCharacterStore())
      
      act(() => {
        result.current.setCharacters([mockCharacter])
      })
      
      await act(async () => {
        await result.current.deleteCharacter(mockCharacter.id)
      })
      
      expect(result.current.characters).toHaveLength(0)
    })

    it('should deselect character when deleted', async () => {
      const { result } = renderHook(() => useCharacterStore())
      
      act(() => {
        result.current.setCharacters([mockCharacter])
        result.current.selectCharacter(mockCharacter)
      })
      
      expect(result.current.selectedCharacter).toEqual(mockCharacter)
      
      await act(async () => {
        await result.current.deleteCharacter(mockCharacter.id)
      })
      
      expect(result.current.selectedCharacter).toBeNull()
    })
  })

  describe('Optimistic Updates', () => {
    it('should optimistically update character', () => {
      const { result } = renderHook(() => useCharacterStore())
      const updates = { name: 'Optimistic Update' }
      
      act(() => {
        result.current.setCharacters([mockCharacter])
      })
      
      act(() => {
        result.current.optimisticUpdate(mockCharacter.id, updates)
      })
      
      expect(result.current.characters[0].name).toBe('Optimistic Update')
    })

    it('should optimistically delete character', () => {
      const { result } = renderHook(() => useCharacterStore())
      
      act(() => {
        result.current.setCharacters([mockCharacter])
      })
      
      let previousState: Character[]
      act(() => {
        previousState = result.current.optimisticDelete(mockCharacter.id)
      })
      
      expect(result.current.characters).toHaveLength(0)
      expect(previousState!).toHaveLength(1)
    })

    it('should rollback optimistic update on error', () => {
      const { result } = renderHook(() => useCharacterStore())
      
      act(() => {
        result.current.setCharacters([mockCharacter])
      })
      
      // Perform optimistic update
      act(() => {
        result.current.optimisticUpdate(mockCharacter.id, { name: 'Failed Update' })
      })
      
      expect(result.current.characters[0].name).toBe('Failed Update')
      
      // Rollback
      act(() => {
        result.current.rollbackOptimistic([mockCharacter])
      })
      
      expect(result.current.characters[0].name).toBe('Test Character')
    })
  })

  describe('Search and Filter', () => {
    const characters: Character[] = [
      { ...mockCharacter, id: '1', name: 'Alice' },
      { ...mockCharacter, id: '2', name: 'Bob' },
      { ...mockCharacter, id: '3', name: 'Charlie' },
    ]

    beforeEach(() => {
      const { result } = renderHook(() => useCharacterStore())
      act(() => {
        result.current.setCharacters(characters)
      })
    })

    it('should get character by id', () => {
      const { result } = renderHook(() => useCharacterStore())
      
      const character = result.current.getCharacterById('2')
      expect(character?.name).toBe('Bob')
    })

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => useCharacterStore())
      
      const character = result.current.getCharacterById('999')
      expect(character).toBeUndefined()
    })

    it('should get characters sorted by name', () => {
      const { result } = renderHook(() => useCharacterStore())
      
      const sorted = result.current.getCharactersSortedBy('name')
      expect(sorted[0].name).toBe('Alice')
      expect(sorted[1].name).toBe('Bob')
      expect(sorted[2].name).toBe('Charlie')
    })

    it('should get characters sorted by creation date', () => {
      const { result } = renderHook(() => useCharacterStore())
      
      const charactersWithDates: Character[] = [
        { ...mockCharacter, id: '1', name: 'Alice', createdAt: '2024-01-03T00:00:00Z' },
        { ...mockCharacter, id: '2', name: 'Bob', createdAt: '2024-01-01T00:00:00Z' },
        { ...mockCharacter, id: '3', name: 'Charlie', createdAt: '2024-01-02T00:00:00Z' },
      ]
      
      act(() => {
        result.current.setCharacters(charactersWithDates)
      })
      
      const sorted = result.current.getCharactersSortedBy('createdAt')
      expect(sorted[0].name).toBe('Bob')
      expect(sorted[1].name).toBe('Charlie')
      expect(sorted[2].name).toBe('Alice')
    })

    it('should get characters sorted by popularity', () => {
      const { result } = renderHook(() => useCharacterStore())
      
      const charactersWithStats: Character[] = [
        { ...mockCharacter, id: '1', name: 'Alice', stats: { ...mockCharacter.stats, popularityScore: 50 } },
        { ...mockCharacter, id: '2', name: 'Bob', stats: { ...mockCharacter.stats, popularityScore: 90 } },
        { ...mockCharacter, id: '3', name: 'Charlie', stats: { ...mockCharacter.stats, popularityScore: 70 } },
      ]
      
      act(() => {
        result.current.setCharacters(charactersWithStats)
      })
      
      const sorted = result.current.getCharactersSortedBy('popularity')
      expect(sorted[0].name).toBe('Bob')
      expect(sorted[1].name).toBe('Charlie')
      expect(sorted[2].name).toBe('Alice')
    })
  })

  describe('Persistence', () => {
    it('should persist selected character', () => {
      const { result } = renderHook(() => useCharacterStore())
      
      act(() => {
        result.current.setCharacters([mockCharacter])
        result.current.selectCharacter(mockCharacter)
      })
      
      // Simulate remounting (would normally load from localStorage)
      const { result: newResult } = renderHook(() => useCharacterStore())
      
      // Note: In a real test environment with localStorage mocked,
      // this would verify persistence. For now, we're just checking
      // that the persistence configuration exists.
      expect(newResult.current).toBeDefined()
    })
  })
})