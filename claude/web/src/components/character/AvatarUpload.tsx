import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, User, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { compressImage } from '@/utils/imageUtils'

interface AvatarUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
  className?: string
}

export function AvatarUpload({ value, onChange, className }: AvatarUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      try {
        // Compress image before uploading
        const compressedImage = await compressImage(file, 400, 400, 0.8)
        onChange(compressedImage)
      } catch (error) {
        console.error('Failed to compress image:', error)
        // Fallback to original if compression fails
        const reader = new FileReader()
        reader.onload = () => {
          if (reader.result) {
            onChange(reader.result as string)
          }
        }
        reader.readAsDataURL(file)
      }
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const handleRemove = () => {
    onChange(undefined)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Character avatar"
            className="h-24 w-24 rounded-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6"
            onClick={handleRemove}
            aria-label="Remove avatar"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          )}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          ) : (
            <User className="h-8 w-8 text-muted-foreground mb-2" />
          )}
          <p className="text-sm text-muted-foreground">
            Drag & drop your image here, or click to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, GIF up to 5MB
          </p>
        </div>
      )}
    </div>
  )
}