import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Character } from '@/types/api.types'
import { characterService } from '@/services/api/characters'

interface CharacterState {
  // State
  characters: Character[]
  selectedCharacter: Character | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchCharacters: () => Promise<void>
  createCharacter: (data: Omit<Character, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => Promise<Character>
  updateCharacter: (id: string, data: Partial<Character>) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>
  selectCharacter: (character: Character | null) => void
  clearError: () => void
  
  // Optimistic updates
  optimisticUpdate: (id: string, data: Partial<Character>) => void
  optimisticDelete: (id: string) => void
  rollbackOptimistic: (id: string, originalData?: Character) => void
}

export const useCharacterStore = create<CharacterState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        characters: [],
        selectedCharacter: null,
        isLoading: false,
        error: null,

        // Fetch all characters
        fetchCharacters: async () => {
          set({ isLoading: true, error: null })
          try {
            const characters = await characterService.getAll()
            set({ characters, isLoading: false })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch characters',
              isLoading: false 
            })
          }
        },

        // Create a new character
        createCharacter: async (data) => {
          set({ isLoading: true, error: null })
          try {
            const newCharacter = await characterService.create(data)
            set((state) => ({ 
              characters: [newCharacter, ...state.characters],
              isLoading: false 
            }))
            return newCharacter
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to create character',
              isLoading: false 
            })
            throw error
          }
        },

        // Update character
        updateCharacter: async (id, data) => {
          const { optimisticUpdate, rollbackOptimistic } = get()
          const original = get().characters.find(c => c.id === id)
          
          // Optimistic update
          optimisticUpdate(id, data)
          
          try {
            const updated = await characterService.update(id, data)
            set((state) => ({
              characters: state.characters.map(c => c.id === id ? updated : c)
            }))
          } catch (error) {
            // Rollback on error
            rollbackOptimistic(id, original)
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update character'
            })
            throw error
          }
        },

        // Delete character
        deleteCharacter: async (id) => {
          const { optimisticDelete, rollbackOptimistic } = get()
          const original = get().characters.find(c => c.id === id)
          
          // Optimistic delete
          optimisticDelete(id)
          
          try {
            await characterService.delete(id)
          } catch (error) {
            // Rollback on error
            if (original) {
              rollbackOptimistic(id, original)
            }
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete character'
            })
            throw error
          }
        },

        // Select character
        selectCharacter: (character) => {
          set({ selectedCharacter: character })
        },

        // Clear error
        clearError: () => {
          set({ error: null })
        },

        // Optimistic update helper
        optimisticUpdate: (id, data) => {
          set((state) => ({
            characters: state.characters.map(c => 
              c.id === id ? { ...c, ...data } : c
            ),
            selectedCharacter: state.selectedCharacter?.id === id 
              ? { ...state.selectedCharacter, ...data }
              : state.selectedCharacter
          }))
        },

        // Optimistic delete helper
        optimisticDelete: (id) => {
          set((state) => ({
            characters: state.characters.filter(c => c.id !== id),
            selectedCharacter: state.selectedCharacter?.id === id 
              ? null 
              : state.selectedCharacter
          }))
        },

        // Rollback helper
        rollbackOptimistic: (id, originalData) => {
          if (originalData) {
            set((state) => ({
              characters: state.characters.some(c => c.id === id)
                ? state.characters.map(c => c.id === id ? originalData : c)
                : [...state.characters, originalData]
            }))
          }
        }
      }),
      {
        name: 'character-store',
        partialize: (state) => ({ 
          selectedCharacter: state.selectedCharacter 
        })
      }
    )
  )
)