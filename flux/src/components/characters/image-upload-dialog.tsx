'use client'

import { useState, useCallback } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

interface ImageUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (files: File[]) => Promise<void>
  characterName: string
}

interface PreviewImage {
  file: File
  url: string
  id: string
}

export function ImageUploadDialog({ 
  open, 
  onOpenChange, 
  onUpload, 
  characterName 
}: ImageUploadDialogProps) {
  const { toast } = useToast()
  const [previews, setPreviews] = useState<PreviewImage[]>([])
  const [uploading, setUploading] = useState(false)
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
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image`,
          variant: "destructive"
        })
        return false
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive"
        })
        return false
      }
      
      return true
    })

    const newPreviews: PreviewImage[] = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }))

    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removePreview = (id: string) => {
    setPreviews(prev => {
      const removed = prev.find(p => p.id === id)
      if (removed) {
        URL.revokeObjectURL(removed.url)
      }
      return prev.filter(p => p.id !== id)
    })
  }

  const handleUpload = async () => {
    if (previews.length === 0) return

    setUploading(true)
    try {
      const files = previews.map(p => p.file)
      await onUpload(files)
      
      // Clean up preview URLs
      previews.forEach(p => URL.revokeObjectURL(p.url))
      setPreviews([])
      onOpenChange(false)
    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      previews.forEach(p => URL.revokeObjectURL(p.url))
      setPreviews([])
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload Reference Images for {characterName}</DialogTitle>
          <DialogDescription>
            Add reference images to help maintain character consistency
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              disabled={uploading}
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
                PNG, JPG, or WebP • Max 10MB per file
              </p>
            </label>
          </div>

          {/* Preview grid */}
          {previews.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {previews.length} {previews.length === 1 ? 'image' : 'images'} ready to upload
              </p>
              <div className="grid grid-cols-4 gap-2">
                {previews.map((preview) => (
                  <div key={preview.id} className="relative group">
                    <div className="aspect-square relative rounded-md overflow-hidden">
                      <Image
                        src={preview.url}
                        alt="Upload preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removePreview(preview.id)}
                      className="absolute -top-2 -right-2 p-1 bg-background border rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={uploading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>Tips for best results:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Use high-quality images with clear views of the character</li>
                <li>Include various angles and expressions</li>
                <li>Avoid heavily edited or filtered images</li>
                <li>Consistent lighting helps maintain character features</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={previews.length === 0 || uploading}
            >
              {uploading ? 'Uploading...' : `Upload ${previews.length} ${previews.length === 1 ? 'Image' : 'Images'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}