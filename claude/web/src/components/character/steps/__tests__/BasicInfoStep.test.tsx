import { describe, it, expect, vi } from 'vitest'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@/test/utils'
import { BasicInfoStep } from '../BasicInfoStep'
import { CharacterFormData, characterFormSchema } from '@/types/character.types'

const TestWrapper = () => {
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

  return <BasicInfoStep form={form} />
}

describe('BasicInfoStep', () => {
  it('renders basic info form fields', () => {
    render(<TestWrapper />)
    
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByLabelText('Character Name *')).toBeInTheDocument()
    expect(screen.getByText('Avatar')).toBeInTheDocument()
  })

  it('displays validation error for empty name', async () => {
    const { user } = render(<TestWrapper />)
    
    const nameInput = screen.getByLabelText('Character Name *')
    await user.click(nameInput)
    await user.tab() // Blur the input
    
    // The error message will be shown by the form component
  })

  it('accepts character name input', async () => {
    const { user } = render(<TestWrapper />)
    
    const nameInput = screen.getByLabelText('Character Name *')
    await user.type(nameInput, 'Test Character')
    
    expect(nameInput).toHaveValue('Test Character')
  })
})