'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus, Edit2, Trash2, Image, Info, Wand2, Eye } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { TrainingDialog } from './training-dialog'
import type { Character } from '@/server/types/character'

interface CharacterListProps {
  onSelectCharacter: (character: Character) => void
  onCreateCharacter: () => void
  onViewDetails?: (character: Character) => void
  selectedCharacterId?: number
}

const tooltips = {
  characterList: "Your saved characters. Each character has unique traits and appearance settings that can be reused across generations.",
  createCharacter: "Create a new character with specific appearance traits and generation settings",
  editCharacter: "Edit this character's details and settings",
  deleteCharacter: "Delete this character permanently. This action cannot be undone.",
  characterTags: "Tags help organize and identify character traits"
}

export function CharacterList({ 
  onSelectCharacter, 
  onCreateCharacter,
  onViewDetails,
  selectedCharacterId 
}: CharacterListProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [trainingCharacter, setTrainingCharacter] = useState<Character | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCharacters()
  }, [])

  const loadCharacters = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getCharacters()
      setCharacters(data)
    } catch (error) {
      console.error('Failed to load characters:', error)
      toast({
        title: "Failed to load characters",
        description: "Please try refreshing the page",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, character: Character) => {
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to delete "${character.name}"?`)) {
      return
    }

    try {
      await apiClient.deleteCharacter(character.id)
      toast({
        title: "Character deleted",
        description: `"${character.name}" has been deleted successfully`
      })
      loadCharacters()
    } catch (error) {
      console.error('Failed to delete character:', error)
      toast({
        title: "Failed to delete character",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Characters</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltips.characterList}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={onCreateCharacter}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Character
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltips.createCharacter}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading characters...
            </div>
          ) : characters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No characters created yet
              </p>
              <Button onClick={onCreateCharacter} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Character
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                    selectedCharacterId === character.id ? 'border-primary bg-accent' : ''
                  }`}
                  onClick={() => onSelectCharacter(character)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{character.name}</h4>
                        {character.lora_path && (
                          <Badge variant="secondary" className="text-xs">
                            LoRA
                          </Badge>
                        )}
                      </div>
                      
                      {character.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {character.description}
                        </p>
                      )}
                      
                      {character.tags && character.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {character.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      {onViewDetails && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                onViewDetails(character)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View details and images</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectCharacter(character)
                            }}
                          >
                            <Image className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Generate with this character</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTrainingCharacter(character)
                            }}
                          >
                            <Wand2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Train LoRA model for this character</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              // TODO: Implement edit functionality
                              toast({
                                title: "Edit character",
                                description: "Edit functionality coming soon"
                              })
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tooltips.editCharacter}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => handleDelete(e, character)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tooltips.deleteCharacter}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {trainingCharacter && (
        <TrainingDialog
          open={!!trainingCharacter}
          onOpenChange={(open) => !open && setTrainingCharacter(null)}
          character={trainingCharacter}
        />
      )}
    </TooltipProvider>
  )
}