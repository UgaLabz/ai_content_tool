'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { RefreshCw, Info, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { LoraModel } from '@/server/types/character'

interface LoraSelectorProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function LoraSelector({ value, onChange, disabled }: LoraSelectorProps) {
  const [loraModels, setLoraModels] = useState<LoraModel[]>([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadLoraModels()
  }, [])

  const loadLoraModels = async () => {
    try {
      setLoading(true)
      const models = await apiClient.getLoraModels()
      setLoraModels(models)
    } catch (error) {
      console.error('Failed to load LoRA models:', error)
      toast({
        title: "Failed to load LoRA models",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const scanForModels = async () => {
    try {
      setScanning(true)
      const response = await apiClient.api.post('/api/lora-models/scan')
      const { count, models } = response.data
      
      setLoraModels(models)
      
      toast({
        title: "Scan complete",
        description: `Found ${count} LoRA models`
      })
    } catch (error) {
      console.error('Failed to scan for LoRA models:', error)
      toast({
        title: "Scan failed",
        description: "Please check your LoRA directories",
        variant: "destructive"
      })
    } finally {
      setScanning(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="lora-select">LoRA Model</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Select a LoRA model for this character. LoRA models are custom-trained to generate specific character appearances consistently.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={scanForModels}
                disabled={scanning || disabled}
              >
                {scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Scan for new LoRA models</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Select
          value={value || 'none'}
          onValueChange={(val) => onChange(val === 'none' ? '' : val)}
          disabled={disabled || loading}
        >
          <SelectTrigger id="lora-select">
            <SelectValue placeholder="Select a LoRA model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex flex-col items-start">
                <span className="font-medium">No LoRA</span>
                <span className="text-xs text-muted-foreground">
                  Use base model without LoRA
                </span>
              </div>
            </SelectItem>
            
            {loraModels.map((model) => (
              <SelectItem key={model.id} value={model.file_path}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{model.name}</span>
                  {model.description && (
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  )}
                  {model.trigger_words && (
                    <span className="text-xs text-muted-foreground">
                      Triggers: {model.trigger_words}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loraModels.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground">
            No LoRA models found. Click the refresh button to scan for models in /media/rese/AL/models/loras
          </p>
        )}
      </div>
    </TooltipProvider>
  )
}