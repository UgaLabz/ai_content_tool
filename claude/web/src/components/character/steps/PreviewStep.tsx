import { UseFormReturn } from 'react-hook-form'
import { CharacterFormData } from '@/types/character.types'
import { CharacterPreview } from '../CharacterPreview'

interface PreviewStepProps {
  form: UseFormReturn<CharacterFormData>
}

export function PreviewStep({ form }: PreviewStepProps) {
  const formData = form.watch()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Character Preview</h3>
        <p className="text-sm text-muted-foreground">
          Review your character and test their personality
        </p>
      </div>

      <CharacterPreview formData={formData} />
    </div>
  )
}