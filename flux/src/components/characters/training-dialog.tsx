'use client'

import { useState } from 'react'
import { Loader2, Rocket } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatasetBuilder } from '@/components/training/dataset-builder'
import { TrainingConfig } from '@/components/training/training-config'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'
import type { Character } from '@/server/types/character'
import type { LoraTrainingConfig } from '@/server/types/training'

interface TrainingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  character: Character
}

export function TrainingDialog({ open, onOpenChange, character }: TrainingDialogProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('dataset')
  const [dataset, setDataset] = useState<any[]>([])
  const [trainingConfig, setTrainingConfig] = useState<Partial<LoraTrainingConfig>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDatasetReady = (images: any[]) => {
    setDataset(images)
    setActiveTab('config')
    toast({
      title: "Dataset Ready",
      description: `${images.length} images prepared for training`,
    })
  }

  const handleConfigChange = (config: Partial<LoraTrainingConfig>) => {
    setTrainingConfig(config)
  }

  const startTraining = async () => {
    if (dataset.length === 0) {
      toast({
        title: "No Dataset",
        description: "Please prepare a dataset first",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Upload images and create training job
      const uploadedImages = []
      
      for (const image of dataset) {
        if (image.file) {
          const { url } = await apiClient.uploadImage(image.file)
          uploadedImages.push({
            image_path: url,
            caption: image.caption
          })
        }
      }

      // Create training job
      const response = await apiClient.createTrainingJob({
        character_id: character.id,
        config: {
          ...trainingConfig,
          output_name: `${character.name.toLowerCase().replace(/\s+/g, '_')}_lora`,
          output_dir: `/media/rese/AL/models/loras/trained/${character.id}`,
        },
        images: uploadedImages
      })

      toast({
        title: "Training Started",
        description: "Your LoRA training job has been queued",
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to start training:', error)
      toast({
        title: "Training Failed",
        description: error instanceof Error ? error.message : "Failed to start training",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Train LoRA for {character.name}</DialogTitle>
          <DialogDescription>
            Create a custom LoRA model to generate consistent images of your character
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dataset" disabled={isSubmitting}>
              1. Dataset
            </TabsTrigger>
            <TabsTrigger value="config" disabled={dataset.length === 0 || isSubmitting}>
              2. Configuration
            </TabsTrigger>
            <TabsTrigger value="review" disabled={dataset.length === 0 || !trainingConfig.network_dim || isSubmitting}>
              3. Review & Start
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dataset" className="mt-6">
            <DatasetBuilder
              characterId={character.id}
              characterName={character.name}
              onDatasetReady={handleDatasetReady}
            />
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <TrainingConfig onConfigChange={handleConfigChange} />
          </TabsContent>

          <TabsContent value="review" className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Training Summary</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Character</p>
                  <p className="font-medium">{character.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dataset Size</p>
                  <p className="font-medium">{dataset.length} images</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Network Rank</p>
                  <p className="font-medium">{trainingConfig.network_dim || 32}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Training Steps</p>
                  <p className="font-medium">{trainingConfig.max_train_steps || 2000}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Learning Rate</p>
                  <p className="font-medium">{trainingConfig.learning_rate || 0.0001}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estimated Time</p>
                  <p className="font-medium">
                    {Math.round((trainingConfig.max_train_steps || 2000) * dataset.length / 60)} minutes
                  </p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Training will run in the background. You'll be notified when it's complete.
                  The trained LoRA will be automatically available for use with this character.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={startTraining}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" />
                      Start Training
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}