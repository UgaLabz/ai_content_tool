'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { CharacterList } from '@/components/characters/character-list'
import { CharacterDialog } from '@/components/characters/character-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { Character } from '@/server/types/character'

export default function CharactersPage() {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreateCharacter = () => {
    setSelectedCharacter(undefined)
    setDialogOpen(true)
  }

  const handleSelectCharacter = (character: Character) => {
    // Navigate to generate page with character selected
    router.push(`/generate?character=${character.id}`)
  }

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Character Management</h1>
          <p className="text-muted-foreground">
            Create and manage characters for consistent image generation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CharacterList 
              key={refreshKey}
              onSelectCharacter={handleSelectCharacter}
              onCreateCharacter={handleCreateCharacter}
            />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-1">What are Characters?</h4>
                  <p className="text-muted-foreground">
                    Characters allow you to define specific appearances and traits that can be 
                    reused across multiple image generations, ensuring consistency.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">How to use:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Create a character with detailed appearance traits</li>
                    <li>Optionally add a LoRA model for enhanced consistency</li>
                    <li>Select the character when generating images</li>
                    <li>The character's traits will be automatically included</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Pro Tips:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Be specific in your base prompt</li>
                    <li>Use tags to organize characters</li>
                    <li>Save different style presets per character</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <CharacterDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          character={selectedCharacter}
          onSuccess={handleSuccess}
        />
      </div>
    </MainLayout>
  )
}