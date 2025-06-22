'use client'

import { useState } from 'react'
import { Info, Settings, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { LoraTrainingConfig } from '@/server/types/training'

interface TrainingConfigProps {
  onConfigChange: (config: Partial<LoraTrainingConfig>) => void
}

export function TrainingConfig({ onConfigChange }: TrainingConfigProps) {
  const [config, setConfig] = useState<Partial<LoraTrainingConfig>>({
    network_dim: 32,
    network_alpha: 32,
    learning_rate: 0.0001,
    train_batch_size: 1,
    max_train_steps: 2000,
    save_every_n_steps: 500,
    optimizer_type: 'AdamW',
    lr_scheduler: 'cosine',
    lr_warmup_steps: 100,
    mixed_precision: 'fp16',
    gradient_checkpointing: true,
    dataset_config: {
      resolution: 1024,
      center_crop: false,
      caption_extension: '.txt',
      keep_tokens: 0,
      shuffle_caption: false,
      cache_latents: true
    }
  })

  const updateConfig = (key: keyof LoraTrainingConfig | string, value: any) => {
    const newConfig = { ...config }
    
    if (key.includes('.')) {
      // Handle nested properties
      const [parent, child] = key.split('.')
      if (parent === 'dataset_config') {
        newConfig.dataset_config = {
          ...newConfig.dataset_config,
          [child]: value
        }
      }
    } else {
      // @ts-ignore
      newConfig[key] = value
    }
    
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  return (
    <TooltipProvider>
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="dataset">Dataset</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Basic Training Settings
            </h4>
            
            <div className="space-y-4">
              {/* Network Rank */}
              <div>
                <Label className="flex items-center gap-2">
                  Network Rank (LoRA Dimension)
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Higher values capture more detail but increase file size</p>
                      <p>Recommended: 16-32 for characters, 64-128 for styles</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[config.network_dim || 32]}
                    onValueChange={([value]) => updateConfig('network_dim', value)}
                    min={4}
                    max={128}
                    step={4}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm text-right">{config.network_dim}</span>
                </div>
              </div>

              {/* Learning Rate */}
              <div>
                <Label className="flex items-center gap-2">
                  Learning Rate
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How fast the model learns. Lower = more stable</p>
                      <p>Recommended: 1e-4 to 1e-5</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  type="number"
                  value={config.learning_rate}
                  onChange={(e) => updateConfig('learning_rate', parseFloat(e.target.value))}
                  min={0.000001}
                  max={0.01}
                  step={0.00001}
                  className="mt-2"
                />
              </div>

              {/* Training Steps */}
              <div>
                <Label className="flex items-center gap-2">
                  Training Steps
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total number of training iterations</p>
                      <p>Recommended: 100 * number of images</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[config.max_train_steps || 2000]}
                    onValueChange={([value]) => updateConfig('max_train_steps', value)}
                    min={100}
                    max={10000}
                    step={100}
                    className="flex-1"
                  />
                  <span className="w-16 text-sm text-right">{config.max_train_steps}</span>
                </div>
              </div>

              {/* Batch Size */}
              <div>
                <Label className="flex items-center gap-2">
                  Batch Size
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of images processed at once</p>
                      <p>Higher = faster but uses more VRAM</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select
                  value={config.train_batch_size?.toString()}
                  onValueChange={(value) => updateConfig('train_batch_size', parseInt(value))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Low VRAM)</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="4">4 (High VRAM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Advanced Settings
            </h4>
            
            <div className="space-y-4">
              {/* Optimizer */}
              <div>
                <Label>Optimizer</Label>
                <Select
                  value={config.optimizer_type}
                  onValueChange={(value) => updateConfig('optimizer_type', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AdamW">AdamW (Recommended)</SelectItem>
                    <SelectItem value="AdamW8bit">AdamW 8-bit (Low VRAM)</SelectItem>
                    <SelectItem value="Lion">Lion (Experimental)</SelectItem>
                    <SelectItem value="SGDNesterov">SGD with Nesterov</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* LR Scheduler */}
              <div>
                <Label>Learning Rate Scheduler</Label>
                <Select
                  value={config.lr_scheduler}
                  onValueChange={(value) => updateConfig('lr_scheduler', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cosine">Cosine</SelectItem>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="constant">Constant</SelectItem>
                    <SelectItem value="polynomial">Polynomial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mixed Precision */}
              <div>
                <Label>Mixed Precision</Label>
                <Select
                  value={config.mixed_precision}
                  onValueChange={(value) => updateConfig('mixed_precision', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Disabled</SelectItem>
                    <SelectItem value="fp16">FP16 (Recommended)</SelectItem>
                    <SelectItem value="bf16">BF16 (A100/3090+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Gradient Checkpointing */}
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Gradient Checkpointing
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reduces VRAM usage but slows training</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Switch
                  checked={config.gradient_checkpointing}
                  onCheckedChange={(checked) => updateConfig('gradient_checkpointing', checked)}
                />
              </div>

              {/* Save Frequency */}
              <div>
                <Label>Save Checkpoint Every N Steps</Label>
                <Input
                  type="number"
                  value={config.save_every_n_steps}
                  onChange={(e) => updateConfig('save_every_n_steps', parseInt(e.target.value))}
                  min={100}
                  step={100}
                  className="mt-2"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="dataset" className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-4">Dataset Settings</h4>
            
            <div className="space-y-4">
              {/* Resolution */}
              <div>
                <Label>Training Resolution</Label>
                <Select
                  value={config.dataset_config?.resolution?.toString()}
                  onValueChange={(value) => updateConfig('dataset_config.resolution', parseInt(value))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512">512×512</SelectItem>
                    <SelectItem value="768">768×768</SelectItem>
                    <SelectItem value="1024">1024×1024 (Recommended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Center Crop */}
              <div className="flex items-center justify-between">
                <Label>Center Crop Images</Label>
                <Switch
                  checked={config.dataset_config?.center_crop}
                  onCheckedChange={(checked) => updateConfig('dataset_config.center_crop', checked)}
                />
              </div>

              {/* Cache Latents */}
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Cache Latents
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Pre-compute VAE encodings to speed up training</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Switch
                  checked={config.dataset_config?.cache_latents}
                  onCheckedChange={(checked) => updateConfig('dataset_config.cache_latents', checked)}
                />
              </div>

              {/* Shuffle Caption */}
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Shuffle Caption Tags
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Randomly reorder caption tags during training</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Switch
                  checked={config.dataset_config?.shuffle_caption}
                  onCheckedChange={(checked) => updateConfig('dataset_config.shuffle_caption', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  )
}