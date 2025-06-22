'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Upload, Trash2, Star, Image as ImageIcon, Grid3x3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'
import { ImageUploadDialog } from './image-upload-dialog'
import { CharacterImageGrid } from './character-image-grid'
import { GenerationHistoryComponent } from './generation-history'
import type { CharacterWithImages } from '@/server/types/character'

interface CharacterDetailProps {
  characterId: number
  onBack: () => void
}

export function CharacterDetail({ characterId, onBack }: CharacterDetailProps) {
  const { toast } = useToast()
  const [character, setCharacter] = useState<CharacterWithImages | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadCharacter()
  }, [characterId])

  const loadCharacter = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getCharacter(characterId)
      setCharacter(data)
    } catch (error) {
      console.error('Failed to load character:', error)
      toast({
        title: "Failed to load character",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (files: File[]) => {
    try {
      for (const file of files) {
        const { url } = await apiClient.uploadImage(file)
        await apiClient.addCharacterImage(characterId, {
          image_path: url,
          is_primary: character?.images.length === 0 // First image is primary
        })
      }
      
      toast({
        title: "Images uploaded",
        description: `${files.length} images added successfully`
      })
      
      // Reload character to show new images
      await loadCharacter()
    } catch (error) {
      console.error('Failed to upload images:', error)
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  const handleSetPrimary = async (imageId: number) => {
    try {
      await apiClient.setPrimaryImage(characterId, imageId)
      toast({
        title: "Primary image updated",
        description: "The primary image has been changed"
      })
      await loadCharacter()
    } catch (error) {
      console.error('Failed to set primary image:', error)
      toast({
        title: "Failed to update primary image",
        variant: "destructive"
      })
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      await apiClient.deleteCharacterImage(imageId)
      toast({
        title: "Image deleted",
        description: "The image has been removed"
      })
      await loadCharacter()
    } catch (error) {
      console.error('Failed to delete image:', error)
      toast({
        title: "Failed to delete image",
        variant: "destructive"
      })
    }
  }

  if (loading || !character) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading character...</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{character.name}</h2>
              {character.description && (
                <p className="text-muted-foreground">{character.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {character.lora_path && (
              <Badge variant="secondary">LoRA Trained</Badge>
            )}
            <Badge variant="outline">
              {character.images.length} {character.images.length === 1 ? 'image' : 'images'}
            </Badge>
          </div>
        </div>

        {/* Character Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Character Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Base Prompt</p>
              <p className="text-sm mt-1">{character.base_prompt}</p>
            </div>
            
            {character.negative_prompt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Negative Prompt</p>
                <p className="text-sm mt-1">{character.negative_prompt}</p>
              </div>
            )}
            
            {character.tags && character.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {character.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Gallery */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reference Images</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="rounded-r-none"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Grid view</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="rounded-l-none"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>List view</TooltipContent>
                  </Tooltip>
                </div>

                <Button onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {character.images.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No reference images uploaded yet
                </p>
                <Button onClick={() => setUploadOpen(true)} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Image
                </Button>
              </div>
            ) : (
              <CharacterImageGrid
                images={character.images}
                viewMode={viewMode}
                onSetPrimary={handleSetPrimary}
                onDelete={handleDeleteImage}
              />
            )}
          </CardContent>
        </Card>

        {/* Generation History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Generations</CardTitle>
          </CardHeader>
          <CardContent>
            <GenerationHistoryComponent characterId={characterId} />
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <ImageUploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onUpload={handleImageUpload}
          characterName={character.name}
        />
      </div>
    </TooltipProvider>
  )
}