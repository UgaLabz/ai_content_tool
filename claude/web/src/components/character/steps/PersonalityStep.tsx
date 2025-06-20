import type { UseFormReturn } from 'react-hook-form'
import { Plus, X } from 'lucide-react'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Slider } from '@/components/ui/Slider'
import { Input } from '@/components/ui/Input'
import type { CharacterFormData } from '@/types/character.types'
import { TRAIT_OPTIONS } from '@/types/character.types'
import { useState } from 'react'

interface PersonalityStepProps {
  form: UseFormReturn<CharacterFormData>
}

export function PersonalityStep({ form }: PersonalityStepProps) {
  const { watch, setValue, formState: { errors } } = form
  const personality = watch('personality')
  const [customTrait, setCustomTrait] = useState('')
  const [customQuirk, setCustomQuirk] = useState('')

  const handleAddTrait = (trait: string) => {
    if (!personality.traits.includes(trait)) {
      setValue('personality.traits', [...personality.traits, trait])
    }
  }

  const handleRemoveTrait = (trait: string) => {
    setValue(
      'personality.traits',
      personality.traits.filter((t) => t !== trait)
    )
  }

  const handleAddCustomTrait = () => {
    if (customTrait.trim() && !personality.traits.includes(customTrait.trim())) {
      setValue('personality.traits', [...personality.traits, customTrait.trim()])
      setCustomTrait('')
    }
  }

  const handleAddQuirk = () => {
    if (customQuirk.trim()) {
      setValue('personality.quirks', [...(personality.quirks || []), customQuirk.trim()])
      setCustomQuirk('')
    }
  }

  const handleRemoveQuirk = (quirk: string) => {
    setValue(
      'personality.quirks',
      personality.quirks?.filter((q) => q !== quirk) || []
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-foreground">Personality Traits</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Define your character's personality and behavioral traits
        </p>
      </div>

      {/* Personality Traits */}
      <div className="space-y-3">
        <Label>Character Traits *</Label>
        <div className="flex flex-wrap gap-2">
          {TRAIT_OPTIONS.map((trait) => (
            <Badge
              key={trait}
              variant={personality.traits.includes(trait) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => 
                personality.traits.includes(trait) 
                  ? handleRemoveTrait(trait)
                  : handleAddTrait(trait)
              }
            >
              {trait}
            </Badge>
          ))}
        </div>
        
        {/* Custom trait input */}
        <div className="flex gap-2">
          <Input
            placeholder="Add custom trait"
            value={customTrait}
            onChange={(e) => setCustomTrait(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTrait())}
          />
          <Button type="button" size="sm" onClick={handleAddCustomTrait}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Selected traits */}
        {personality.traits.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {personality.traits.map((trait) => (
              <Badge key={trait} variant="secondary">
                {trait}
                <button
                  type="button"
                  onClick={() => handleRemoveTrait(trait)}
                  className="ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        {errors.personality?.traits && (
          <p className="text-sm text-destructive">
            {errors.personality.traits.message}
          </p>
        )}
      </div>

      {/* Personality Sliders */}
      <div className="space-y-6 rounded-lg border bg-card/50 p-6">
        <Slider
          label="Humor Level"
          value={[personality.humor]}
          onValueChange={(value) => setValue('personality.humor', value[0])}
          min={0}
          max={100}
          step={1}
        />
        
        <Slider
          label="Formality"
          value={[personality.formality]}
          onValueChange={(value) => setValue('personality.formality', value[0])}
          min={0}
          max={100}
          step={1}
        />
        
        <Slider
          label="Enthusiasm"
          value={[personality.enthusiasm]}
          onValueChange={(value) => setValue('personality.enthusiasm', value[0])}
          min={0}
          max={100}
          step={1}
        />
        
        <Slider
          label="Empathy"
          value={[personality.empathy]}
          onValueChange={(value) => setValue('personality.empathy', value[0])}
          min={0}
          max={100}
          step={1}
        />
      </div>

      {/* Quirks */}
      <div className="space-y-3">
        <Label>Quirks & Habits (Optional)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a quirk or habit"
            value={customQuirk}
            onChange={(e) => setCustomQuirk(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddQuirk())}
          />
          <Button type="button" size="sm" onClick={handleAddQuirk}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {personality.quirks && personality.quirks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {personality.quirks.map((quirk, index) => (
              <Badge key={index} variant="secondary">
                {quirk}
                <button
                  type="button"
                  onClick={() => handleRemoveQuirk(quirk)}
                  className="ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}