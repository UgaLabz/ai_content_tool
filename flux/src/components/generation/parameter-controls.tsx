'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Shuffle, Info } from 'lucide-react'

export interface GenerationParameters {
  width: number
  height: number
  steps: number
  seed: number
  sampler: string
  scheduler: string
}

interface ParameterControlsProps {
  parameters: GenerationParameters
  onChange: (params: GenerationParameters) => void
  disabled?: boolean
}

// Tooltip content for each parameter
const tooltips = {
  resolution: "The dimensions of the generated image in pixels. Higher resolutions require more VRAM and take longer to generate.",
  steps: "The number of denoising steps. Flux Schnell is optimized for 4 steps. More steps can improve quality but increase generation time.",
  seed: "A number that controls randomness. Using the same seed with the same prompt will produce similar images.",
  sampler: "The algorithm used to denoise the image. Different samplers can produce different artistic styles and qualities.",
  scheduler: "Controls how noise is reduced during generation. 'Simple' works well for most cases with Flux Schnell."
}

// Sampler descriptions
const samplerDescriptions: Record<string, string> = {
  euler: "Fast and reliable, good for most use cases",
  euler_ancestral: "More creative/varied results than regular Euler",
  heun: "Higher quality but slower than Euler",
  dpm_2: "Fast, good quality results",
  dpm_2_ancestral: "More varied results than DPM 2",
  lms: "Classic sampler, can be unstable at low steps",
  dpmpp_2m: "High quality, good for detailed images",
  dpmpp_sde: "Good for artistic/stylized results"
}

// Scheduler descriptions
const schedulerDescriptions: Record<string, string> = {
  simple: "Linear noise reduction, recommended for Flux",
  normal: "Standard noise schedule",
  karras: "Smoother noise reduction curve",
  exponential: "Exponential noise reduction",
  sgm_uniform: "Uniform noise schedule from SGM paper"
}

export function ParameterControls({ 
  parameters, 
  onChange, 
  disabled = false 
}: ParameterControlsProps) {
  const resolutionPresets = [
    { label: '1:1 (512x512)', width: 512, height: 512 },
    { label: '1:1 (1024x1024)', width: 1024, height: 1024 },
    { label: '16:9 (1024x576)', width: 1024, height: 576 },
    { label: '9:16 (576x1024)', width: 576, height: 1024 },
    { label: '4:3 (1024x768)', width: 1024, height: 768 },
    { label: '3:4 (768x1024)', width: 768, height: 1024 },
  ]
  
  const handleResolutionPreset = (preset: typeof resolutionPresets[0]) => {
    onChange({
      ...parameters,
      width: preset.width,
      height: preset.height
    })
  }
  
  const randomizeSeed = () => {
    onChange({
      ...parameters,
      seed: Math.floor(Math.random() * 1000000)
    })
  }
  
  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Generation Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resolution Presets */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Resolution Presets</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltips.resolution}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {resolutionPresets.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolutionPreset(preset)}
                  disabled={disabled}
                  className={
                    preset.width === parameters.width && 
                    preset.height === parameters.height 
                      ? 'border-primary' 
                      : ''
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Width & Height */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width: {parameters.width}</Label>
              <Slider
                id="width"
                min={256}
                max={1536}
                step={64}
                value={[parameters.width]}
                onValueChange={(value) => onChange({ ...parameters, width: value[0] })}
                disabled={disabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="height">Height: {parameters.height}</Label>
              <Slider
                id="height"
                min={256}
                max={1536}
                step={64}
                value={[parameters.height]}
                onValueChange={(value) => onChange({ ...parameters, height: value[0] })}
                disabled={disabled}
              />
            </div>
          </div>
          
          {/* Steps */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="steps">Steps: {parameters.steps}</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltips.steps}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Slider
              id="steps"
              min={1}
              max={8}
              step={1}
              value={[parameters.steps]}
              onValueChange={(value) => onChange({ ...parameters, steps: value[0] })}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Flux Schnell is optimized for 4 steps
            </p>
          </div>
          
          {/* Seed */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="seed">Seed</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltips.seed}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-2">
              <Input
                id="seed"
                type="number"
                value={parameters.seed}
                onChange={(e) => onChange({ 
                  ...parameters, 
                  seed: parseInt(e.target.value) || 0 
                })}
                disabled={disabled}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={randomizeSeed}
                    disabled={disabled}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate random seed</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          {/* Sampler */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="sampler">Sampler</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltips.sampler}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={parameters.sampler}
              onValueChange={(value) => onChange({ ...parameters, sampler: value })}
              disabled={disabled}
            >
              <SelectTrigger id="sampler">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(samplerDescriptions).map(([value, description]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{value.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">{description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Scheduler */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="scheduler">Scheduler</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltips.scheduler}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={parameters.scheduler}
              onValueChange={(value) => onChange({ ...parameters, scheduler: value })}
              disabled={disabled}
            >
              <SelectTrigger id="scheduler">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(schedulerDescriptions).map(([value, description]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{value.charAt(0).toUpperCase() + value.slice(1)}</span>
                      <span className="text-xs text-muted-foreground">{description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}