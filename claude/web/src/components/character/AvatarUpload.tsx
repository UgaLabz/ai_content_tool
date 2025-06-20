import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, User, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

interface AvatarUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
  className?: string
}

export function AvatarUpload({ value, onChange, className }: AvatarUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      // In a real app, you would upload to a server
      // For now, we'll use a local URL
      const url = URL.createObjectURL(file)
      onChange(url)
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
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
            alt="Avatar"
            className="h-24 w-24 rounded-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-colors',
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          )}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <Upload className="h-8 w-8 text-muted-foreground" />
          ) : (
            <User className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Click or drag to upload avatar
      </p>
    </div>
  )
}