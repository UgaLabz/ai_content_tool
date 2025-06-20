import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { CharacterDetailView } from '@/components/character/CharacterDetailView'
import { Character } from '@/types/api.types'
import { characterService } from '@/services/api/character'
import { useToast } from '@/hooks/useToast'

export function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
      navigate('/characters')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (character: Character) => {
    navigate(`/characters/${character.id}/edit`)
  }

  const handleDelete = async (character: Character) => {
    if (!confirm(`Are you sure you want to delete ${character.name}?`)) {
      return
    }

    try {
      await characterService.delete(character.id)
      showSuccess('Character deleted successfully')
      navigate('/characters')
    } catch (error) {
      showError('Failed to delete character')
      console.error('Error deleting character:', error)
    }
  }

  const handleBack = () => {
    navigate('/characters')
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