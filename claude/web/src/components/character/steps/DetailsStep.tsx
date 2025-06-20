import type { UseFormReturn } from 'react-hook-form'
import { Plus, X } from 'lucide-react'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { CharacterFormData } from '@/types/character.types'
import { useState } from 'react'

interface DetailsStepProps {
  form: UseFormReturn<CharacterFormData>
}

export function DetailsStep({ form }: DetailsStepProps) {
  const { watch, setValue, register } = form
  const catchphrases = watch('catchphrases') || []
  const [catchphrase, setCatchphrase] = useState('')

  const handleAddCatchphrase = () => {
    if (catchphrase.trim()) {
      setValue('catchphrases', [...catchphrases, catchphrase.trim()])
      setCatchphrase('')
    }
  }

  const handleRemoveCatchphrase = (phrase: string) => {
    setValue(
      'catchphrases',
      catchphrases.filter((c) => c !== phrase)
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-foreground">Additional Details</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add backstory and signature phrases to make your character unique
        </p>
      </div>

      {/* Background */}
      <div className="space-y-2">
        <Label htmlFor="background" className="text-base">Background Story (Optional)</Label>
        <Textarea
          id="background"
          placeholder="Describe your character's history, motivations, or any relevant backstory..."
          rows={4}
          className="bg-background"
          {...register('background')}
        />
        <p className="text-xs text-muted-foreground">
          This helps maintain consistency in your character's responses
        </p>
      </div>

      {/* Catchphrases */}
      <div className="space-y-3">
        <Label>Catchphrases (Optional)</Label>
        <p className="text-xs text-muted-foreground">
          Add signature phrases or expressions your character frequently uses
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., 'That's absolutely brilliant!'"
            value={catchphrase}
            onChange={(e) => setCatchphrase(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCatchphrase())}
          />
          <Button type="button" size="sm" onClick={handleAddCatchphrase}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {catchphrases.length > 0 && (
          <div className="space-y-2">
            {catchphrases.map((phrase, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2"
              >
                <span className="text-sm">{phrase}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCatchphrase(phrase)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="text-sm font-medium">Tips for great characters:</h4>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• Give your character a unique perspective or worldview</li>
          <li>• Include specific details that make them memorable</li>
          <li>• Think about how their background influences their speech</li>
          <li>• Catchphrases should feel natural, not forced</li>
        </ul>
      </div>
    </div>
  )
}