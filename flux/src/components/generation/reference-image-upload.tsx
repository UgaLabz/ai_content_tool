'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Upload, X, Image as ImageIcon, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'

interface ReferenceImageSettings {
  enabled: boolean
  imagePath: string
  imageUrl?: string
  strength: number
  mode: 'style' | 'character' | 'composition'
  startPercent: number
  endPercent: number
}

interface ReferenceImageUploadProps {
  onChange: (settings: ReferenceImageSettings | null) => void
  disabled?: boolean
}

const tooltips = {
  referenceImage: "Use an existing image to guide the generation. This can transfer style, character appearance, or composition.",
  strength: "How strongly the reference image influences the generation (0.0 to 1.0)",
  mode: {
    style: "Extract and apply the artistic style while keeping your subject",
    character: "Use the character's appearance from the reference image",
    composition: "Copy the pose and layout to apply to your character"
  },
  startPercent: "When to start applying the reference (0% = beginning)",
  endPercent: "When to stop applying the reference (100% = end)"
}

export function ReferenceImageUpload({ onChange, disabled }: ReferenceImageUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [settings, setSettings] = useState<ReferenceImageSettings>({
    enabled: false,
    imagePath: '',
    strength: 0.85,
    mode: 'style',
    startPercent: 0,
    endPercent: 100
  })

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, or WebP image",
        variant: "destructive"
      })
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)
      
      // Create form data
      const formData = new FormData()
      formData.append('image', file)

      // Upload image
      const response = await apiClient.api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const { filename, url } = response.data
      
      // Update settings
      const newSettings = {
        ...settings,
        enabled: true,
        imagePath: filename,
        imageUrl: url
      }
      setSettings(newSettings)
      onChange(newSettings)

      toast({
        title: "Image uploaded",
        description: "Reference image ready to use"
      })
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

  const handleRemove = () => {
    setSettings({
      ...settings,
      enabled: false,
      imagePath: '',
      imageUrl: undefined
    })
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const updateSettings = (updates: Partial<ReferenceImageSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    onChange(newSettings.enabled ? newSettings : null)
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Reference Image</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltips.referenceImage}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {settings.enabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!settings.enabled ? (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || uploading}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Reference Image'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPEG, PNG, or WebP • Max 10MB
              </p>
            </div>
          ) : (
            <>
              {/* Preview */}
              {settings.imageUrl && (
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  <img
                    src={settings.imageUrl}
                    alt="Reference"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}

              {/* Mode Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Reference Mode</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Choose how the reference image affects generation</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={settings.mode}
                  onValueChange={(value: 'style' | 'character' | 'composition') => 
                    updateSettings({ mode: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="style">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Style Transfer</span>
                        <span className="text-xs text-muted-foreground">
                          {tooltips.mode.style}
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="character">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Character Reference</span>
                        <span className="text-xs text-muted-foreground">
                          {tooltips.mode.character}
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="composition">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Composition Reference</span>
                        <span className="text-xs text-muted-foreground">
                          {tooltips.mode.composition}
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Strength */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Strength: {settings.strength}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{tooltips.strength}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider
                  value={[settings.strength]}
                  onValueChange={([value]) => updateSettings({ strength: value })}
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={disabled}
                />
              </div>

              {/* Application Range */}
              <div className="space-y-2">
                <Label>Application Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Start: {settings.startPercent}%</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tooltips.startPercent}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider
                      value={[settings.startPercent]}
                      onValueChange={([value]) => updateSettings({ startPercent: value })}
                      min={0}
                      max={100}
                      step={5}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">End: {settings.endPercent}%</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tooltips.endPercent}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider
                      value={[settings.endPercent]}
                      onValueChange={([value]) => updateSettings({ endPercent: value })}
                      min={0}
                      max={100}
                      step={5}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}