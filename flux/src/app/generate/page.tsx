'use client'

import { useState, useEffect } from 'react'
import { PromptInput } from '@/components/generation/prompt-input'
import { ParameterControls, GenerationParameters } from '@/components/generation/parameter-controls'
import { OutputSettings, OutputSettings as OutputSettingsType } from '@/components/generation/output-settings'
import { GenerationProgress } from '@/components/generation/generation-progress'
import { ImageGallery } from '@/components/gallery/image-gallery'
import { ExistingImages } from '@/components/gallery/existing-images'
import { GenerationQueue } from '@/components/generation/generation-queue'
import { useGenerationStore } from '@/lib/store'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

export default function GeneratePage() {
  const { toast } = useToast()
  const { 
    setGenerating, 
    setProgress, 
    setError, 
    addToHistory 
  } = useGenerationStore()
  
  const [parameters, setParameters] = useState<GenerationParameters>({
    width: 1024,
    height: 1024,
    steps: 4,
    seed: Math.floor(Math.random() * 1000000),
    sampler: 'euler',
    scheduler: 'simple'
  })
  
  const [outputSettings, setOutputSettings] = useState<OutputSettingsType>({
    outputPath: '',
    filenameOverride: ''
  })
  
  useEffect(() => {
    // Set up socket listeners
    apiClient.onGenerationStart((data) => {
      setProgress(0)
    })
    
    apiClient.onGenerationProgress((data) => {
      setProgress(data.progress)
    })
    
    apiClient.onGenerationComplete((data) => {
      setProgress(100)
    })
    
    apiClient.onGenerationError((data) => {
      setError(data.error)
      toast({
        title: "Generation Failed",
        description: data.error,
        variant: "destructive"
      })
    })
    
    return () => {
      apiClient.removeAllListeners()
    }
  }, [setProgress, setError, toast])
  
  const handleGenerate = async (prompt: string) => {
    try {
      setGenerating(true)
      setError(null)
      
      const response = await apiClient.generateImage({
        prompt,
        ...parameters,
        ...outputSettings
      })
      
      if (response.success) {
        addToHistory({
          id: response.id,
          url: response.url,
          prompt: prompt,
          params: response.params,
          timestamp: new Date()
        })
        
        toast({
          title: "Image Generated!",
          description: "Your image has been created successfully."
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed'
      setError(message)
      toast({
        title: "Generation Failed",
        description: message,
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left sidebar - Controls */}
      <div className="space-y-6">
        <OutputSettings onSettingsChange={setOutputSettings} />
        <PromptInput onGenerate={handleGenerate} />
        <ParameterControls 
          parameters={parameters} 
          onChange={setParameters}
          disabled={useGenerationStore.getState().isGenerating}
        />
      </div>
      
      {/* Main content - Gallery */}
      <div className="lg:col-span-2 space-y-6">
        <GenerationProgress />
        <GenerationQueue />
        <ImageGallery />
        <ExistingImages outputPath={outputSettings.outputPath || '/media/rese/AL/ComfyUI/output'} />
      </div>
    </div>
  )
}