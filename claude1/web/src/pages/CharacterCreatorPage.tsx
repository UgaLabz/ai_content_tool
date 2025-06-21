import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { CharacterCreatorForm } from '@/components/character/CharacterCreatorForm'
import type { CharacterFormData } from '@/types/character.types'
import { characterService } from '@/services/api'

export function CharacterCreatorPage() {
  const [, setIsCreating] = useState(false)

  const handleSubmit = async (data: CharacterFormData) => {
    setIsCreating(true)
    try {
      // In a real app, this would call the API
      const character = await characterService.create({
        ...data,
        personality: {
          ...data.personality,
          quirks: data.personality.quirks || [],
        },
        voice: {
          ...data.voice,
          speechPatterns: data.voice.speechPatterns || [],
          languageStyle: data.voice.languageStyle || '',
        },
        catchphrases: data.catchphrases || [],
        background: data.background || '',
      })
      
      console.log('Character created:', character)
      // Navigate to character detail page
      // navigate(`/characters/${character.id}`)
    } catch (error) {
      console.error('Failed to create character:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    // navigate('/characters')
    console.log('Cancelled character creation')
  }

  return (
    <PageLayout
      title="Create New Character"
      description="Design a unique AI personality for your content"
    >
      <CharacterCreatorForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </PageLayout>
  )
}