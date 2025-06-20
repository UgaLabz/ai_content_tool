import { describe, it, expect } from 'vitest'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@/test/utils'
import { PersonalityStep } from '../PersonalityStep'
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

  return <PersonalityStep form={form} />
}

describe('PersonalityStep', () => {
  it('renders personality configuration', () => {
    render(<TestWrapper />)
    
    expect(screen.getByText('Personality Configuration')).toBeInTheDocument()
    expect(screen.getByText('Personality Traits')).toBeInTheDocument()
    expect(screen.getByText('Personality Sliders')).toBeInTheDocument()
  })

  it('shows all personality sliders', () => {
    render(<TestWrapper />)
    
    expect(screen.getByText('Humor')).toBeInTheDocument()
    expect(screen.getByText('Formality')).toBeInTheDocument()
    expect(screen.getByText('Enthusiasm')).toBeInTheDocument()
    expect(screen.getByText('Empathy')).toBeInTheDocument()
  })

  it('displays predefined personality traits', () => {
    render(<TestWrapper />)
    
    expect(screen.getByText('Friendly')).toBeInTheDocument()
    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('Humorous')).toBeInTheDocument()
    expect(screen.getByText('Creative')).toBeInTheDocument()
  })

  it('allows adding custom traits', async () => {
    const { user } = render(<TestWrapper />)
    
    const customTraitInput = screen.getByPlaceholderText('Add custom trait...')
    await user.type(customTraitInput, 'Adventurous')
    await user.keyboard('{Enter}')
    
    expect(screen.getByText('Adventurous')).toBeInTheDocument()
  })
})