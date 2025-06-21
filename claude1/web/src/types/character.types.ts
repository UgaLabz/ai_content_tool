import { z } from 'zod'

// Character creation schema
export const characterFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  avatar: z.string().optional(),
  personality: z.object({
    traits: z.array(z.string()).min(1, 'Add at least one trait'),
    humor: z.number().min(0).max(100),
    formality: z.number().min(0).max(100),
    enthusiasm: z.number().min(0).max(100),
    empathy: z.number().min(0).max(100),
    quirks: z.array(z.string()).optional(),
  }),
  voice: z.object({
    tone: z.string().min(2, 'Tone is required'),
    vocabulary: z.string().min(2, 'Vocabulary style is required'),
    sentenceStructure: z.string().min(2, 'Sentence structure is required'),
    speechPatterns: z.array(z.string()).optional(),
    languageStyle: z.string().optional(),
  }),
  catchphrases: z.array(z.string()).optional(),
  background: z.string().optional(),
  relationships: z.array(z.object({
    characterId: z.string(),
    type: z.enum(['friend', 'rival', 'mentor', 'student', 'family', 'colleague']),
    description: z.string(),
  })).optional(),
})

export type CharacterFormData = z.infer<typeof characterFormSchema>

// Form step types
export type FormStep = 'basics' | 'personality' | 'voice' | 'details' | 'preview'

export const FORM_STEPS: FormStep[] = ['basics', 'personality', 'voice', 'details', 'preview']

export const STEP_LABELS: Record<FormStep, string> = {
  basics: 'Basic Info',
  personality: 'Personality',
  voice: 'Voice & Style',
  details: 'Details',
  preview: 'Preview',
}

// Preset trait options
export const TRAIT_OPTIONS = [
  'Friendly', 'Professional', 'Humorous', 'Serious', 'Creative',
  'Analytical', 'Empathetic', 'Bold', 'Cautious', 'Optimistic',
  'Realistic', 'Imaginative', 'Practical', 'Theoretical', 'Spontaneous',
  'Organized', 'Flexible', 'Direct', 'Diplomatic', 'Enthusiastic',
]

export const TONE_OPTIONS = [
  'Casual', 'Formal', 'Friendly', 'Professional', 'Authoritative',
  'Playful', 'Serious', 'Educational', 'Conversational', 'Inspirational',
]

export const VOCABULARY_OPTIONS = [
  'Simple', 'Advanced', 'Technical', 'Colloquial', 'Academic',
  'Pop Culture', 'Industry Jargon', 'Mixed', 'Youth Slang', 'Classic',
]

export const SENTENCE_STRUCTURE_OPTIONS = [
  'Short and punchy', 'Long and flowing', 'Mixed variety', 'Question-heavy',
  'Statement-focused', 'Exclamatory', 'Fragmented', 'Complex', 'Simple',
]