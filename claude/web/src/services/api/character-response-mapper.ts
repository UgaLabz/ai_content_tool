import type { Character } from '@/types/api.types'

interface APICharacterProfile {
  id: string
  name: string
  description?: string
  avatar?: string
  personality: {
    traits: string[]
    humor: number
    formality: number
    empathy: number
    enthusiasm?: number
    quirks?: string[]
  }
  voice: {
    tone: string
    vocabulary: string
    sentenceStructure: string
    speechPatterns?: string[]
    catchphrases?: string[]
  }
  background?: {
    culturalBackground?: string
    interests?: string[]
  }
  metadata?: {
    createdAt: string | Date
    updatedAt: string | Date
  }
}

export function mapAPIResponseToCharacter(apiData: APICharacterProfile): Character {
  return {
    id: apiData.id,
    name: apiData.name,
    avatar: apiData.avatar,
    personality: {
      traits: apiData.personality.traits || [],
      humor: apiData.personality.humor || 50,
      formality: apiData.personality.formality || 50,
      enthusiasm: apiData.personality.enthusiasm || 50,
      empathy: apiData.personality.empathy || 50,
      quirks: apiData.personality.quirks || [],
    },
    voice: {
      tone: apiData.voice.tone,
      vocabulary: apiData.voice.vocabulary,
      sentenceStructure: apiData.voice.sentenceStructure,
      speechPatterns: apiData.voice.speechPatterns || [],
      languageStyle: apiData.voice.catchphrases?.join(', '),
    },
    catchphrases: apiData.voice.catchphrases || [],
    background: apiData.background?.culturalBackground || apiData.description,
    relationships: [],
    memoryAnchors: [],
    stats: {
      messagesGenerated: 0,
      lastUsed: new Date().toISOString(),
      popularityScore: 0,
    },
    createdAt: apiData.metadata?.createdAt 
      ? (typeof apiData.metadata.createdAt === 'string' 
          ? apiData.metadata.createdAt 
          : new Date(apiData.metadata.createdAt).toISOString())
      : new Date().toISOString(),
    updatedAt: apiData.metadata?.updatedAt
      ? (typeof apiData.metadata.updatedAt === 'string'
          ? apiData.metadata.updatedAt
          : new Date(apiData.metadata.updatedAt).toISOString())
      : new Date().toISOString(),
  }
}

export function mapAPIResponseArray(apiData: APICharacterProfile[]): Character[] {
  return apiData.map(mapAPIResponseToCharacter)
}