'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Folder, RotateCcw, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'

interface OutputSettingsProps {
  onSettingsChange: (settings: OutputSettings) => void
}

export interface OutputSettings {
  outputPath: string
  filenameOverride: string
}

const tooltips = {
  outputPath: "The directory where generated images will be saved. You can browse for a folder or enter the path manually.",
  filenameOverride: "Optional custom filename for generated images. If left empty, filenames will be automatically generated based on the prompt."
}

export function OutputSettings({ onSettingsChange }: OutputSettingsProps) {
  const { toast } = useToast()
  const [outputPath, setOutputPath] = useState<string>('')
  const [filenameOverride, setFilenameOverride] = useState<string>('')
  const [isLoadingPath, setIsLoadingPath] = useState(false)

  // Load default output path on mount
  useEffect(() => {
    loadDefaultPath()
  }, [])

  const loadDefaultPath = async () => {
    try {
      setIsLoadingPath(true)
      const response = await apiClient.getOutputPath()
      setOutputPath(response.path)
    } catch (error) {
      console.error('Failed to load default path:', error)
      setOutputPath('/media/rese/AL/ComfyUI/output')
    } finally {
      setIsLoadingPath(false)
    }
  }

  const handlePathChange = (path: string) => {
    setOutputPath(path)
    onSettingsChange({ outputPath: path, filenameOverride })
  }

  const handleFilenameChange = (filename: string) => {
    // Remove invalid characters from filename
    const sanitized = filename.replace(/[<>:"/\\|?*]/g, '_')
    setFilenameOverride(sanitized)
    onSettingsChange({ outputPath, filenameOverride: sanitized })
  }

  const handleBrowse = async () => {
    toast({
      title: "Folder browsing",
      description: "Please enter the desired output path manually. Native folder browsing is not available in web applications.",
    })
  }

  const resetToDefault = () => {
    loadDefaultPath()
    setFilenameOverride('')
    onSettingsChange({ outputPath: '/media/rese/AL/ComfyUI/output', filenameOverride: '' })
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Output Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Output Path */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="output-path">Output Folder</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltips.outputPath}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          <div className="flex gap-2">
            <Input
              id="output-path"
              type="text"
              placeholder="/media/rese/AL/ComfyUI/output"
              value={outputPath}
              onChange={(e) => handlePathChange(e.target.value)}
              disabled={isLoadingPath}
              className="flex-1"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleBrowse}
                  disabled={isLoadingPath}
                >
                  <Folder className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Browse folders</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={resetToDefault}
                  disabled={isLoadingPath}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset to default path</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-muted-foreground">
            Where ComfyUI will save generated images
          </p>
        </div>

        {/* Filename Override */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="filename">Custom Filename (Optional)</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{tooltips.filenameOverride}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="filename"
            type="text"
            placeholder="Leave empty for auto-generated name"
            value={filenameOverride}
            onChange={(e) => handleFilenameChange(e.target.value)}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            Override the default filename. If empty, uses prompt-based name.
          </p>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  )
}