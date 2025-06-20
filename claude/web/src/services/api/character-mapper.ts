import { v4 as uuidv4 } from 'uuid'
import type { CreateCharacterDto } from './characters'

interface APICharacterProfile {
  id: string
  name: string
  description: string
  personality: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
    humor: number
    formality: number
    empathy: number
    creativity: number
    analyticalThinking: number
    traits: string[]
    quirks: string[]
    values: string[]
  }
  background: {
    occupation?: string
    education?: string
    origin?: string
    age?: number | string
    interests: string[]
    expertise: string[]
    experiences: string[]
    culturalBackground?: string
  }
  voice: {
    tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful' | 'empathetic'
    vocabulary: 'simple' | 'moderate' | 'advanced' | 'technical' | 'mixed'
    sentenceStructure: 'simple' | 'complex' | 'varied'
    pacing: 'slow' | 'moderate' | 'fast' | 'dynamic'
    speechPatterns: string[]
    catchphrases: string[]
    greetings: string[]
    farewells: string[]
    formalityLevel: number
    useOfSlang: boolean
    useOfTechnicalTerms: boolean
    preferredPronouns?: string
  }
  knowledge: Array<{
    domain: string
    expertise: 'basic' | 'intermediate' | 'advanced' | 'expert'
    confidence: number
    limitations: string[]
  }>
  relationships?: any[]
  memories?: any[]
}

export function mapToAPIFormat(character: CreateCharacterDto): APICharacterProfile {
  // Map voice tone
  const toneMap: Record<string, APICharacterProfile['voice']['tone']> = {
    casual: 'casual',
    formal: 'professional',
    friendly: 'friendly',
    authoritative: 'authoritative',
    playful: 'playful',
    empathetic: 'empathetic',
  }

  // Map vocabulary
  const vocabularyMap: Record<string, APICharacterProfile['voice']['vocabulary']> = {
    simple: 'simple',
    moderate: 'moderate',
    advanced: 'advanced',
    technical: 'technical',
    mixed: 'mixed',
  }

  // Map sentence structure
  const sentenceMap: Record<string, APICharacterProfile['voice']['sentenceStructure']> = {
    short: 'simple',
    medium: 'varied',
    long: 'complex',
    simple: 'simple',
    complex: 'complex',
    varied: 'varied',
  }

  // Generate personality traits based on the sliders
  const generatePersonalityFromSliders = (personality: typeof character.personality) => {
    // Map humor, formality, enthusiasm, empathy to Big Five traits
    return {
      openness: Math.round((personality.enthusiasm + 50) / 2), // Enthusiasm contributes to openness
      conscientiousness: Math.round((personality.formality + 50) / 2), // Formality suggests conscientiousness
      extraversion: Math.round((personality.enthusiasm + personality.humor) / 2), // Humor and enthusiasm suggest extraversion
      agreeableness: Math.round((personality.empathy + 50) / 2), // Empathy is core to agreeableness
      neuroticism: Math.round(100 - ((personality.humor + personality.enthusiasm) / 2)), // Lower humor/enthusiasm might indicate higher neuroticism
      humor: personality.humor,
      formality: personality.formality,
      empathy: personality.empathy,
      creativity: Math.round((personality.humor + personality.enthusiasm) / 2), // Humor and enthusiasm suggest creativity
      analyticalThinking: Math.round(personality.formality), // Formality might correlate with analytical thinking
      traits: personality.traits,
      quirks: personality.quirks || [],
      values: [], // Could be derived from traits
    }
  }

  return {
    id: uuidv4(),
    name: character.name,
    description: character.background || `${character.name} is a character with ${character.personality.traits.join(', ')} traits.`,
    personality: generatePersonalityFromSliders(character.personality),
    background: {
      occupation: 'Character',
      interests: character.personality.traits,
      expertise: [],
      experiences: [],
      culturalBackground: character.background,
    },
    voice: {
      tone: toneMap[character.voice.tone] || 'friendly',
      vocabulary: vocabularyMap[character.voice.vocabulary] || 'moderate',
      sentenceStructure: sentenceMap[character.voice.sentenceStructure] || 'varied',
      pacing: 'moderate',
      speechPatterns: character.voice.speechPatterns || [],
      catchphrases: character.catchphrases || [],
      greetings: ['Hello!', 'Hi there!', 'Greetings!'],
      farewells: ['Goodbye!', 'See you later!', 'Take care!'],
      formalityLevel: character.personality.formality,
      useOfSlang: character.personality.formality < 30,
      useOfTechnicalTerms: false,
      preferredPronouns: 'they/them',
    },
    knowledge: [
      {
        domain: 'general',
        expertise: 'intermediate',
        confidence: 70,
        limitations: [],
      },
    ],
    relationships: character.relationships || [],
    memories: [],
  }
}