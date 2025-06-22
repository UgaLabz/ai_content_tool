'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info, Plus, X } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Character, CreateCharacterRequest } from '@/server/types/character'

interface CharacterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  character?: Character
  onSuccess: () => void
}

const tooltips = {
  name: "A unique name to identify this character",
  description: "Optional description to help remember this character's traits",
  basePrompt: "The core description that defines this character's appearance. This will be included in every generation.",
  negativePrompt: "Elements to avoid when generating this character (e.g., 'blurry, low quality')",
  tags: "Add tags to help organize and search for characters",
  loraPath: "Path to a LoRA model file for this character (optional)",
  loraStrength: "How strongly to apply the LoRA model (0.0 to 1.0)"
}

export function CharacterDialog({ 
  open, 
  onOpenChange, 
  character,
  onSuccess 
}: CharacterDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  
  const [formData, setFormData] = useState<CreateCharacterRequest>({
    name: '',
    description: '',
    base_prompt: '',
    negative_prompt: '',
    tags: [],
    lora_path: '',
    lora_strength: 0.8
  })

  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name,
        description: character.description || '',
        base_prompt: character.base_prompt,
        negative_prompt: character.negative_prompt || '',
        tags: character.tags || [],
        lora_path: character.lora_path || '',
        lora_strength: character.lora_strength || 0.8
      })
    } else {
      setFormData({
        name: '',
        description: '',
        base_prompt: '',
        negative_prompt: '',
        tags: [],
        lora_path: '',
        lora_strength: 0.8
      })
    }
  }, [character, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the character",
        variant: "destructive"
      })
      return
    }
    
    if (!formData.base_prompt.trim()) {
      toast({
        title: "Base prompt required",
        description: "Please enter a base prompt for the character",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      if (character) {
        await apiClient.updateCharacter(character.id, formData)
        toast({
          title: "Character updated",
          description: `"${formData.name}" has been updated successfully`
        })
      } else {
        await apiClient.createCharacter(formData)
        toast({
          title: "Character created",
          description: `"${formData.name}" has been created successfully`
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save character:', error)
      toast({
        title: "Failed to save character",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || []
    })
  }

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {character ? 'Edit Character' : 'Create New Character'}
              </DialogTitle>
              <DialogDescription>
                Define a character's appearance and traits for consistent generation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltips.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fantasy Warrior"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltips.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the character"
                  rows={2}
                />
              </div>

              {/* Base Prompt */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="base_prompt">Base Prompt *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{tooltips.basePrompt}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="base_prompt"
                  value={formData.base_prompt}
                  onChange={(e) => setFormData({ ...formData, base_prompt: e.target.value })}
                  placeholder="e.g., A warrior with long silver hair, blue eyes, wearing ornate armor..."
                  rows={4}
                  required
                />
              </div>

              {/* Negative Prompt */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="negative_prompt">Negative Prompt</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{tooltips.negativePrompt}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="negative_prompt"
                  value={formData.negative_prompt}
                  onChange={(e) => setFormData({ ...formData, negative_prompt: e.target.value })}
                  placeholder="e.g., blurry, low quality, distorted..."
                  rows={2}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltips.tags}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag"
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LoRA Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">LoRA Settings (Optional)</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="lora_path">LoRA Model Path</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tooltips.loraPath}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="lora_path"
                    value={formData.lora_path}
                    onChange={(e) => setFormData({ ...formData, lora_path: e.target.value })}
                    placeholder="/media/rese/AL/models/loras/character.safetensors"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="lora_strength">
                      LoRA Strength: {formData.lora_strength}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tooltips.loraStrength}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    id="lora_strength"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[formData.lora_strength || 0.8]}
                    onValueChange={(value) => setFormData({ ...formData, lora_strength: value[0] })}
                    disabled={!formData.lora_path}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : character ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}