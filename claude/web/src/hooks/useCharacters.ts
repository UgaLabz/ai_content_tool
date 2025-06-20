import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCharacterStore } from '@/stores/characterStore'
import { characterService } from '@/services/api/characters'
import type { Character } from '@/types/api.types'
import { queryKeys } from '@/lib/react-query'
import { useToast } from './useToast'

// Hook to fetch all characters
export function useCharacters() {
  const { error: showError } = useToast()
  
  const query = useQuery({
    queryKey: queryKeys.lists(),
    queryFn: () => characterService.getAll(),
  })
  
  // Handle error side effects
  if (query.error) {
    showError('Failed to load characters')
    console.error('Error fetching characters:', query.error)
  }
  
  return query
}

// Hook to fetch a single character
export function useCharacter(id: string | undefined) {
  const { error: showError } = useToast()
  
  const query = useQuery({
    queryKey: queryKeys.detail(id!),
    queryFn: () => characterService.getById(id!),
    enabled: !!id,
  })
  
  // Handle error side effects
  if (query.error && id) {
    showError('Failed to load character')
    console.error('Error fetching character:', query.error)
  }
  
  return query
}

// Hook to create a character
export function useCreateCharacter() {
  const queryClient = useQueryClient()
  const { success: showSuccess, error: showError } = useToast()
  
  return useMutation({
    mutationFn: characterService.create,
    onSuccess: (newCharacter) => {
      // Invalidate and refetch character list
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      
      // Add the new character to the cache
      queryClient.setQueryData(queryKeys.lists(), (old: Character[] = []) => [
        newCharacter,
        ...old,
      ])
      
      showSuccess('Character created successfully!')
    },
    onError: (error: Error) => {
      showError('Failed to create character')
      console.error('Error creating character:', error)
    },
  })
}

// Hook to update a character
export function useUpdateCharacter() {
  const queryClient = useQueryClient()
  const { success: showSuccess, error: showError } = useToast()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Character> }) =>
      characterService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: queryKeys.lists() })
      
      // Snapshot previous values
      const previousCharacter = queryClient.getQueryData(queryKeys.detail(id))
      const previousCharacters = queryClient.getQueryData(queryKeys.lists())
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.detail(id), (old: Character | undefined) => {
        if (!old) return old
        return { ...old, ...data }
      })
      
      queryClient.setQueryData(queryKeys.lists(), (old: Character[] = []) =>
        old.map((char) => (char.id === id ? { ...char, ...data } : char))
      )
      
      return { previousCharacter, previousCharacters }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousCharacter) {
        queryClient.setQueryData(queryKeys.detail(id), context.previousCharacter)
      }
      if (context?.previousCharacters) {
        queryClient.setQueryData(queryKeys.lists(), context.previousCharacters)
      }
      showError('Failed to update character')
      console.error('Error updating character:', err)
    },
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(queryKeys.detail(id), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      showSuccess('Character updated successfully!')
    },
  })
}

// Hook to delete a character
export function useDeleteCharacter() {
  const queryClient = useQueryClient()
  const { success: showSuccess, error: showError } = useToast()
  const selectCharacter = useCharacterStore((state) => state.selectCharacter)
  
  return useMutation({
    mutationFn: characterService.delete,
    onMutate: async (id) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.lists() })
      
      // Snapshot previous value
      const previousCharacters = queryClient.getQueryData(queryKeys.lists())
      
      // Optimistically remove
      queryClient.setQueryData(queryKeys.lists(), (old: Character[] = []) =>
        old.filter((char) => char.id !== id)
      )
      
      // Clear selection if deleting selected character
      const selectedCharacter = useCharacterStore.getState().selectedCharacter
      if (selectedCharacter?.id === id) {
        selectCharacter(null)
      }
      
      return { previousCharacters }
    },
    onError: (err, _id, context) => {
      // Rollback on error
      if (context?.previousCharacters) {
        queryClient.setQueryData(queryKeys.lists(), context.previousCharacters)
      }
      showError('Failed to delete character')
      console.error('Error deleting character:', err)
    },
    onSettled: () => {
      // Invalidate queries after deletion
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      showSuccess('Character deleted successfully')
    },
  })
}

// Hook to duplicate a character
export function useDuplicateCharacter() {
  const createMutation = useCreateCharacter()
  
  return useMutation({
    mutationFn: async (characterId: string) => {
      const character = await characterService.getById(characterId)
      const duplicatedData = {
        name: `${character.name} (Copy)`,
        avatar: character.avatar,
        personality: character.personality,
        voice: character.voice,
        background: character.background,
        relationships: character.relationships || [],
        catchphrases: character.catchphrases || [],
      }
      return createMutation.mutateAsync(duplicatedData)
    },
  })
}