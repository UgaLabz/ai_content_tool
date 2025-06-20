import { useState, useEffect } from 'react'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CharacterGallery } from '@/components/character/CharacterGallery'
import { CharacterCreatorForm } from '@/components/character/CharacterCreatorForm'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLayout } from '@/components/layout/PageLayout'
import { Character } from '@/types/api.types'
import { CharacterFormData } from '@/types/character.types'
import { characterService } from '@/services/api/character'
import { useToast } from '@/hooks/useToast'

export function CharacterGalleryPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreator, setShowCreator] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const { error: showError, success: showSuccess } = useToast()

  // Fetch characters on mount
  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    try {
      setIsLoading(true)
      const data = await characterService.getAll()
      setCharacters(data)
    } catch (error) {
      showError('Failed to load characters')
      console.error('Error fetching characters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCharacter = async (data: CharacterFormData) => {
    try {
      const newCharacter = await characterService.create({
        ...data,
        relationships: data.relationships || [],
      })
      setCharacters(prev => [newCharacter, ...prev])
      setShowCreator(false)
      showSuccess('Character created successfully!')
    } catch (error) {
      showError('Failed to create character')
      console.error('Error creating character:', error)
    }
  }

  const handleEditCharacter = (character: Character) => {
    // TODO: Implement edit functionality
    console.log('Edit character:', character)
  }

  const handleDeleteCharacter = async (character: Character) => {
    if (!confirm(`Are you sure you want to delete ${character.name}?`)) {
      return
    }

    try {
      await characterService.delete(character.id)
      setCharacters(prev => prev.filter(c => c.id !== character.id))
      showSuccess('Character deleted successfully')
    } catch (error) {
      showError('Failed to delete character')
      console.error('Error deleting character:', error)
    }
  }

  const handleDuplicateCharacter = async (character: Character) => {
    try {
      const duplicatedData = {
        name: `${character.name} (Copy)`,
        avatar: character.avatar,
        personality: character.personality,
        voice: character.voice,
        bio: character.bio,
        background: character.background,
        relationships: character.relationships || [],
        catchphrases: character.catchphrases || [],
      }
      const newCharacter = await characterService.create(duplicatedData)
      setCharacters(prev => [newCharacter, ...prev])
      showSuccess('Character duplicated successfully!')
    } catch (error) {
      showError('Failed to duplicate character')
      console.error('Error duplicating character:', error)
    }
  }

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character)
    // TODO: Navigate to character detail page
  }

  if (showCreator) {
    return (
      <PageLayout
        title="Create Character"
        description="Design a new AI character with unique personality and traits"
      >
        <CharacterCreatorForm
          onSubmit={handleCreateCharacter}
          onCancel={() => setShowCreator(false)}
        />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Characters"
      description="Manage your AI characters"
      actions={
        <Button onClick={() => setShowCreator(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Character
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading characters...</p>
          </div>
        </div>
      ) : characters.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No characters yet"
          description="Create your first AI character to start generating content"
          action={
            <Button onClick={() => setShowCreator(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Character
            </Button>
          }
        />
      ) : (
        <CharacterGallery
          characters={characters}
          onCharacterSelect={handleCharacterSelect}
          onCharacterEdit={handleEditCharacter}
          onCharacterDelete={handleDeleteCharacter}
          onCharacterDuplicate={handleDuplicateCharacter}
        />
      )}
    </PageLayout>
  )
}