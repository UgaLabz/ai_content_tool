'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, Maximize2, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ExistingImage {
  id: string
  filename: string
  url: string
  path: string
  size: number
  modified: string
  isCustomPath: boolean
}

interface ExistingImagesProps {
  outputPath: string
}

export function ExistingImages({ outputPath }: ExistingImagesProps) {
  const { toast } = useToast()
  const [images, setImages] = useState<ExistingImage[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const loadImages = async () => {
    try {
      setLoading(true)
      const response = await apiClient.listImages(outputPath)
      setImages(response.images)
    } catch (error) {
      console.error('Failed to load images:', error)
      toast({
        title: "Failed to load images",
        description: "Unable to load images from the output folder.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (outputPath) {
      loadImages()
    }
  }, [outputPath])

  const handleDownload = async (image: ExistingImage) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = image.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the image.",
        variant: "destructive"
      })
    }
  }

  const handleView = (url: string) => {
    window.open(url, '_blank')
  }

  const handleDelete = async (image: ExistingImage) => {
    try {
      setDeletingIds(prev => new Set(prev).add(image.id))
      
      // Delete from backend
      await apiClient.deleteImage(image.url)
      
      // Remove from local state
      setImages(prev => prev.filter(img => img.id !== image.id))
      
      toast({
        title: "Image deleted",
        description: "The image has been removed successfully."
      })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : 'Failed to delete image',
        variant: "destructive"
      })
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(image.id)
        return newSet
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Existing Images</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={loadImages}
                  disabled={loading}
                  className="h-8 w-8"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh image list</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {loading && images.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading images...</span>
            </div>
          ) : images.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No images found in the output folder
            </p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((image) => (
                  <div key={image.id} className="group relative">
                    <div className="aspect-square relative overflow-hidden rounded-lg border bg-muted">
                      <Image
                        src={image.url}
                        alt={image.filename}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8"
                              onClick={() => handleView(image.url)}
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View full size</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8"
                              onClick={() => handleDownload(image)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-8 w-8"
                              onClick={() => handleDelete(image)}
                              disabled={deletingIds.has(image.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mt-1 px-1">
                      <p className="text-xs truncate" title={image.filename}>
                        {image.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(image.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}