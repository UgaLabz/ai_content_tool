'use client'

import { Star, Trash2, Download, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { CharacterImage } from '@/server/types/character'
import Image from 'next/image'
import { useState } from 'react'

interface CharacterImageGridProps {
  images: CharacterImage[]
  viewMode: 'grid' | 'list'
  onSetPrimary: (imageId: number) => void
  onDelete: (imageId: number) => void
}

export function CharacterImageGrid({ 
  images, 
  viewMode, 
  onSetPrimary, 
  onDelete 
}: CharacterImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<CharacterImage | null>(null)

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {images.map((image) => (
          <Card key={image.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={image.image_path}
                  alt="Character reference"
                  fill
                  className="object-cover"
                />
                {image.is_primary && (
                  <div className="absolute top-1 left-1">
                    <Badge variant="secondary" className="text-xs">
                      Primary
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  Image #{image.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  Uploaded {formatDate(image.created_at)}
                </p>
                {image.prompt_used && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {image.prompt_used}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedImage(image)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View full size</TooltipContent>
                  </Tooltip>
                  
                  {!image.is_primary && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onSetPrimary(image.id)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Set as primary</TooltipContent>
                    </Tooltip>
                  )}
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onDelete(image.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete image</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="group relative overflow-hidden">
            <div className="aspect-square relative">
              <Image
                src={image.image_path}
                alt="Character reference"
                fill
                className="object-cover cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => setSelectedImage(image)}
              />
              
              {image.is_primary && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Primary
                  </Badge>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <p className="text-white text-xs truncate">
                    {formatDate(image.created_at)}
                  </p>
                  
                  <div className="flex items-center gap-1">
                    {!image.is_primary && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                onSetPrimary(image.id)
                              }}
                            >
                              <Star className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Set as primary</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(image.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete image</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Full size image viewer */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full">
            <Image
              src={selectedImage.image_path}
              alt="Character reference"
              width={1024}
              height={1024}
              className="object-contain max-h-[90vh] w-auto"
            />
            
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedImage(null)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {selectedImage.prompt_used && (
              <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Prompt Used</p>
                <p className="text-sm text-muted-foreground">{selectedImage.prompt_used}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}