import type { UseFormReturn } from 'react-hook-form'
import { Plus, X } from 'lucide-react'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import type { CharacterFormData } from '@/types/character.types'
import { 
  TONE_OPTIONS, 
  VOCABULARY_OPTIONS, 
  SENTENCE_STRUCTURE_OPTIONS 
} from '@/types/character.types'
import { useState } from 'react'

interface VoiceStepProps {
  form: UseFormReturn<CharacterFormData>
}

export function VoiceStep({ form }: VoiceStepProps) {
  const { watch, setValue, register, formState: { errors } } = form
  const voice = watch('voice')
  const [speechPattern, setSpeechPattern] = useState('')

  const handleAddSpeechPattern = () => {
    if (speechPattern.trim()) {
      setValue('voice.speechPatterns', [...(voice.speechPatterns || []), speechPattern.trim()])
      setSpeechPattern('')
    }
  }

  const handleRemoveSpeechPattern = (pattern: string) => {
    setValue(
      'voice.speechPatterns',
      voice.speechPatterns?.filter((p) => p !== pattern) || []
    )
  }

  const SelectOption = ({ 
    label, 
    options, 
    value, 
    onChange 
  }: { 
    label: string
    options: string[]
    value: string
    onChange: (value: string) => void 
  }) => (
    <div className="space-y-2">
      <Label>{label} *</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Badge
            key={option}
            variant={value === option ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => onChange(option)}
          >
            {option}
          </Badge>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-foreground">Voice & Communication Style</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          How does your character speak and communicate?
        </p>
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <SelectOption
          label="Tone"
          options={TONE_OPTIONS}
          value={voice.tone}
          onChange={(value) => setValue('voice.tone', value)}
        />
        {errors.voice?.tone && (
          <p className="mt-1 text-sm text-destructive">
            {errors.voice.tone.message}
          </p>
        )}
      </div>

      {/* Vocabulary */}
      <div className="space-y-2">
        <SelectOption
          label="Vocabulary Style"
          options={VOCABULARY_OPTIONS}
          value={voice.vocabulary}
          onChange={(value) => setValue('voice.vocabulary', value)}
        />
        {errors.voice?.vocabulary && (
          <p className="mt-1 text-sm text-destructive">
            {errors.voice.vocabulary.message}
          </p>
        )}
      </div>

      {/* Sentence Structure */}
      <div className="space-y-2">
        <SelectOption
          label="Sentence Structure"
          options={SENTENCE_STRUCTURE_OPTIONS}
          value={voice.sentenceStructure}
          onChange={(value) => setValue('voice.sentenceStructure', value)}
        />
        {errors.voice?.sentenceStructure && (
          <p className="mt-1 text-sm text-destructive">
            {errors.voice.sentenceStructure.message}
          </p>
        )}
      </div>

      {/* Language Style */}
      <div className="space-y-2">
        <Label htmlFor="languageStyle" className="text-base">Language Style (Optional)</Label>
        <Input
          id="languageStyle"
          placeholder="e.g., Shakespearean, Modern slang, Corporate speak"
          className="mt-2"
          {...register('voice.languageStyle')}
        />
      </div>

      {/* Speech Patterns */}
      <div className="space-y-3">
        <Label className="text-base">Speech Patterns (Optional)</Label>
        <p className="text-xs text-muted-foreground">
          Add specific phrases or patterns your character uses frequently
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., 'You know what I mean?', 'Indeed...'"
            value={speechPattern}
            onChange={(e) => setSpeechPattern(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpeechPattern())}
          />
          <Button type="button" size="sm" onClick={handleAddSpeechPattern}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {voice.speechPatterns && voice.speechPatterns.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {voice.speechPatterns.map((pattern, index) => (
              <Badge key={index} variant="secondary">
                {pattern}
                <button
                  type="button"
                  onClick={() => handleRemoveSpeechPattern(pattern)}
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