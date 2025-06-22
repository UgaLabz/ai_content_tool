'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Maximize2, Trash2 } from 'lucide-react'
import { useGenerationStore } from '@/lib/store'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

export function ImageGallery() {
  const { history, clearHistory, removeFromHistory } = useGenerationStore()
  const { toast } = useToast()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No images generated yet. Start by entering a prompt above!
          </p>
        </CardContent>
      </Card>
    )
  }
  
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }
  
  const handleView = (url: string) => {
    window.open(url, '_blank')
  }
  
  const handleDelete = async (id: string, url: string) => {
    try {
      setDeletingIds(prev => new Set(prev).add(id))
      
      // Delete from backend
      await apiClient.deleteImage(url)
      
      // Remove from store
      removeFromHistory(id)
      
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
        newSet.delete(id)
        return newSet
      })
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Generated Images</h2>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="relative aspect-square">
              <Image
                src={image.url}
                alt={image.prompt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-sm line-clamp-2 mb-2">
                    {image.prompt}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleView(image.url)}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(
                        image.url, 
                        `flux-${image.id}.png`
                      )}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(image.id, image.url)}
                      disabled={deletingIds.has(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{image.params.width}x{image.params.height}</p>
                <p>{new Date(image.timestamp).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}