'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Check, AlertCircle, Wand2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { apiClient } from '@/lib/api-client'
import Image from 'next/image'

interface DatasetImage {
  id: string
  file?: File
  url: string
  caption: string
  status: 'pending' | 'processing' | 'ready' | 'error'
  error?: string
}

interface DatasetBuilderProps {
  characterId: number
  characterName: string
  onDatasetReady: (images: DatasetImage[]) => void
}

export function DatasetBuilder({ characterId, characterName, onDatasetReady }: DatasetBuilderProps) {
  const { toast } = useToast()
  const [images, setImages] = useState<DatasetImage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    )
    handleFiles(files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    const newImages: DatasetImage[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file),
      caption: `${characterName}, `,
      status: 'pending' as const
    }))

    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const updateCaption = (id: string, caption: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, caption } : img
    ))
  }

  const generateCaptions = async () => {
    setIsProcessing(true)
    
    try {
      // TODO: Implement automatic caption generation using CLIP or BLIP
      toast({
        title: "Caption Generation",
        description: "Automatic caption generation will be implemented soon",
      })
      
      // For now, add character name to all captions
      setImages(prev => prev.map(img => ({
        ...img,
        caption: img.caption.includes(characterName) 
          ? img.caption 
          : `${characterName}, ${img.caption}`
      })))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate captions",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const validateDataset = () => {
    const validImages = images.filter(img => 
      img.caption.trim().length > 0 && img.status !== 'error'
    )

    if (validImages.length < 5) {
      toast({
        title: "Insufficient Images",
        description: "Please add at least 5 images for training",
        variant: "destructive"
      })
      return false
    }

    if (validImages.length > 100) {
      toast({
        title: "Too Many Images",
        description: "Please limit dataset to 100 images maximum",
        variant: "destructive"
      })
      return false
    }

    // Check caption quality
    const shortCaptions = validImages.filter(img => 
      img.caption.trim().split(' ').length < 3
    )
    
    if (shortCaptions.length > 0) {
      toast({
        title: "Caption Quality",
        description: `${shortCaptions.length} images have very short captions. Consider adding more detail.`,
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleProceed = () => {
    if (validateDataset()) {
      onDatasetReady(images.filter(img => img.status !== 'error'))
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Dataset Images</h3>
        
        {/* Upload area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileInput}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop images here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Recommended: 10-50 high-quality images of the character
            </p>
          </label>
        </div>

        {/* Action buttons */}
        {images.length > 0 && (
          <div className="flex gap-2 mt-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateCaptions}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    Auto Caption
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate captions automatically using AI</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              size="sm"
              onClick={handleProceed}
              disabled={images.length < 5}
            >
              Proceed to Training ({images.length} images)
            </Button>
          </div>
        )}
      </Card>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <Image
                  src={image.url}
                  alt="Dataset image"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-2 right-2 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                
                {image.status === 'error' && (
                  <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                )}
                
                {image.status === 'ready' && (
                  <div className="absolute top-2 left-2 p-1 bg-primary/80 rounded-full">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
              
              <div className="p-2">
                <Textarea
                  value={image.caption}
                  onChange={(e) => updateCaption(image.id, e.target.value)}
                  placeholder="Describe this image..."
                  className="min-h-[60px] text-xs"
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Guidelines */}
      <Card className="p-4 bg-muted/50">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Dataset Guidelines
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Use 10-50 high-quality images for best results</li>
          <li>• Include various angles, expressions, and lighting</li>
          <li>• Ensure the character is clearly visible in each image</li>
          <li>• Write detailed captions describing the character and scene</li>
          <li>• Avoid blurry, cropped, or low-resolution images</li>
        </ul>
      </Card>
    </div>
  )
}