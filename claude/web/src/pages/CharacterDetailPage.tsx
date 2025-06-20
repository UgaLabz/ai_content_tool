import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { CharacterDetailView } from '@/components/character/CharacterDetailView'
import type { Character } from '@/types/api.types'
import { characterService } from '@/services/api/characters'
import { useToast } from '@/hooks/useToast'

export function CharacterDetailPage() {
  // TODO: Replace with actual routing params when router is set up
  const id = 'placeholder-id' // This will come from router params
  const [character, setCharacter] = useState<Character | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { error: showError, success: showSuccess } = useToast()

  useEffect(() => {
    if (id) {
      fetchCharacter(id)
    }
  }, [id])

  const fetchCharacter = async (characterId: string) => {
    try {
      setIsLoading(true)
      const data = await characterService.getById(characterId)
      setCharacter(data)
    } catch (error) {
      showError('Failed to load character')
      console.error('Error fetching character:', error)
      // TODO: navigate('/characters')
      console.log('Would navigate to /characters')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (character: Character) => {
    // TODO: navigate(`/characters/${character.id}/edit`)
    console.log('Would navigate to edit:', character.id)
  }

  const handleDelete = async (character: Character) => {
    if (!confirm(`Are you sure you want to delete ${character.name}?`)) {
      return
    }

    try {
      await characterService.delete(character.id)
      showSuccess('Character deleted successfully')
      // TODO: navigate('/characters')
      console.log('Would navigate to /characters')
    } catch (error) {
      showError('Failed to delete character')
      console.error('Error deleting character:', error)
    }
  }

  const handleBack = () => {
    // TODO: navigate('/characters')
    console.log('Would navigate back to /characters')
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading character...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!character) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Character not found</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <CharacterDetailView
        character={character}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </MainLayout>
  )
}