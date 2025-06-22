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
import { Image as ImageIcon, Check, Star, Info, Upload } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { CharacterWithImages, CharacterImage } from '@/server/types/character'

interface CharacterImageSelectorProps {
  character: CharacterWithImages
  onSelectImage: (image: CharacterImage) => void
  onUploadNew: () => void
  selectedImageId?: number
}

const tooltips = {
  characterImages: "Select an image of this character to use as a reference for generation",
  primaryImage: "This is the primary reference image for this character",
  selectImage: "Use this image as a reference for generation",
  uploadNew: "Upload a new reference image for this character"
}

export function CharacterImageSelector({ 
  character, 
  onSelectImage, 
  onUploadNew,
  selectedImageId 
}: CharacterImageSelectorProps) {
  const { toast } = useToast()

  if (!character.images || character.images.length === 0) {
    return (
      <TooltipProvider>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Character Reference Images</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltips.characterImages}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No reference images for this character yet
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onUploadNew} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Reference Image
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltips.uploadNew}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Character Reference Images</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltips.characterImages}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={onUploadNew}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltips.uploadNew}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {character.images.map((image) => (
              <div
                key={image.id}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImageId === image.id 
                    ? 'border-primary ring-2 ring-primary ring-offset-2' 
                    : 'border-transparent hover:border-accent'
                }`}
                onClick={() => onSelectImage(image)}
              >
                <div className="aspect-square bg-muted">
                  {image.thumbnail_path || image.image_path ? (
                    <img
                      src={`/api/image/custom?path=${encodeURIComponent(
                        image.thumbnail_path || image.image_path
                      )}`}
                      alt="Character reference"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                
                {/* Selected indicator */}
                {selectedImageId === image.id && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                
                {/* Primary indicator */}
                {image.is_primary && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white rounded-full p-1">
                        <Star className="h-3 w-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltips.primaryImage}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Prompt used (on hover) */}
                {image.prompt_used && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white line-clamp-2">
                      {image.prompt_used}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}