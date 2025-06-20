import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'
import { useFormPersistence } from '@/hooks/useFormPersistence'
import { useToast } from '@/hooks/useToast'
import { 
  CharacterFormData, 
  characterFormSchema, 
  FormStep, 
  FORM_STEPS, 
  STEP_LABELS 
} from '@/types/character.types'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { PersonalityStep } from './steps/PersonalityStep'
import { VoiceStep } from './steps/VoiceStep'
import { DetailsStep } from './steps/DetailsStep'
import { PreviewStep } from './steps/PreviewStep'

interface CharacterCreatorFormProps {
  onSubmit: (data: CharacterFormData) => void
  onCancel: () => void
}

export function CharacterCreatorForm({ onSubmit, onCancel }: CharacterCreatorFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('basics')
  const currentStepIndex = FORM_STEPS.indexOf(currentStep)
  const { error: showError, success: showSuccess } = useToast()

  const form = useForm<CharacterFormData>({
    resolver: zodResolver(characterFormSchema),
    defaultValues: {
      name: '',
      personality: {
        traits: [],
        humor: 50,
        formality: 50,
        enthusiasm: 50,
        empathy: 50,
        quirks: [],
      },
      voice: {
        tone: '',
        vocabulary: '',
        sentenceStructure: '',
        speechPatterns: [],
      },
      catchphrases: [],
      background: '',
    },
  })

  // Enable form persistence
  const { clearSavedData } = useFormPersistence(form, 'character-creator-draft', {
    exclude: ['avatar'], // Don't persist file URLs
  })

  const handleNext = async () => {
    // Validate current step fields
    let fieldsToValidate: (keyof CharacterFormData)[] = []
    
    switch (currentStep) {
      case 'basics':
        fieldsToValidate = ['name']
        break
      case 'personality':
        fieldsToValidate = ['personality']
        break
      case 'voice':
        fieldsToValidate = ['voice']
        break
    }

    const isValid = fieldsToValidate.length === 0 || 
      await form.trigger(fieldsToValidate)

    if (isValid && currentStepIndex < FORM_STEPS.length - 1) {
      setCurrentStep(FORM_STEPS[currentStepIndex + 1])
    } else if (!isValid) {
      showError('Please fill in all required fields')
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(FORM_STEPS[currentStepIndex - 1])
    }
  }

  const handleSubmit = form.handleSubmit(
    (data) => {
      try {
        onSubmit(data)
        clearSavedData() // Clear draft after successful submission
        showSuccess('Character created successfully!')
      } catch (error) {
        showError('Failed to create character. Please try again.')
      }
    },
    (errors) => {
      console.error('Form validation errors:', errors)
      showError('Please fix the errors in the form')
    }
  )

  const renderStep = () => {
    switch (currentStep) {
      case 'basics':
        return <BasicInfoStep form={form} />
      case 'personality':
        return <PersonalityStep form={form} />
      case 'voice':
        return <VoiceStep form={form} />
      case 'details':
        return <DetailsStep form={form} />
      case 'preview':
        return <PreviewStep form={form} />
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {FORM_STEPS.map((step, index) => (
            <div
              key={step}
              className={cn(
                'flex items-center',
                index < FORM_STEPS.length - 1 && 'flex-1'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium',
                  index <= currentStepIndex
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                )}
              >
                {index + 1}
              </div>
              {index < FORM_STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2',
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          {FORM_STEPS.map((step) => (
            <span
              key={step}
              className={cn(
                'text-xs',
                step === currentStep
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {STEP_LABELS[step]}
            </span>
          ))}
        </div>
      </div>

      {/* Form content */}
      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="min-h-[400px]">{renderStep()}</div>

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStepIndex === 0 ? onCancel : handlePrevious}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {currentStepIndex === 0 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep === 'preview' ? (
              <Button type="submit">Create Character</Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}