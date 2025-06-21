import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CharacterGallery } from '@/components/character/CharacterGallery'
import { CharacterGallerySkeleton } from '@/components/character/CharacterGallerySkeleton'
import { CharacterCreatorForm } from '@/components/character/CharacterCreatorForm'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLayout } from '@/components/layout/PageLayout'
import type { Character } from '@/types/api.types'
import type { CharacterFormData } from '@/types/character.types'
import { 
  useCharacters, 
  useCreateCharacter, 
  // useUpdateCharacter, 
  useDeleteCharacter,
  useDuplicateCharacter 
} from '@/hooks/useCharacters'
// import { useCharacterStore } from '@/stores/characterStore'
import { useToast } from '@/hooks/useToast'

export function CharacterGalleryPage() {
  const [showCreator, setShowCreator] = useState(false)
  const { error: showError, success: showSuccess } = useToast()
  const navigate = useNavigate()

  // React Query hooks
  const { data: characters = [], isLoading } = useCharacters()
  const createCharacterMutation = useCreateCharacter()
  // const updateCharacterMutation = useUpdateCharacter()
  const deleteCharacterMutation = useDeleteCharacter()
  const duplicateCharacterMutation = useDuplicateCharacter()

  const handleCreateCharacter = async (data: CharacterFormData) => {
    try {
      await createCharacterMutation.mutateAsync({
        ...data,
        relationships: data.relationships || [],
      })
      setShowCreator(false)
      showSuccess('Character created successfully!')
    } catch (error) {
      showError('Failed to create character')
      console.error('Error creating character:', error)
    }
  }

  // const handleEditCharacter = async (character: Character, data: Partial<Character>) => {
  //   try {
  //     await updateCharacterMutation.mutateAsync({ id: character.id, data })
  //     showSuccess('Character updated successfully!')
  //   } catch (error) {
  //     showError('Failed to update character')
  //     console.error('Error updating character:', error)
  //   }
  // }

  const handleDeleteCharacter = async (character: Character) => {
    if (!confirm(`Are you sure you want to delete ${character.name}?`)) {
      return
    }

    try {
      await deleteCharacterMutation.mutateAsync(character.id)
      showSuccess('Character deleted successfully')
    } catch (error) {
      showError('Failed to delete character')
      console.error('Error deleting character:', error)
    }
  }

  const handleDuplicateCharacter = async (character: Character) => {
    try {
      await duplicateCharacterMutation.mutateAsync(character.id)
      showSuccess('Character duplicated successfully!')
    } catch (error) {
      showError('Failed to duplicate character')
      console.error('Error duplicating character:', error)
    }
  }

  const handleCharacterSelect = (character: Character) => {
    navigate(`/characters/${character.id}`)
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
        <CharacterGallerySkeleton />
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
          onCharacterEdit={(character) => {
            // TODO: Implement character edit form
            console.log('Edit character:', character)
          }}
          onCharacterDelete={handleDeleteCharacter}
          onCharacterDuplicate={handleDuplicateCharacter}
        />
      )}
    </PageLayout>
  )
}