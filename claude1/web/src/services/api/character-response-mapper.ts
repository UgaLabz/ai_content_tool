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
  // Ensure apiData exists
  if (!apiData) {
    throw new Error('Invalid character data: apiData is null or undefined');
  }

  // Log the incoming data for debugging
  console.log('Mapping API response:', JSON.stringify(apiData, null, 2));

  // Check if apiData is an empty object
  if (Object.keys(apiData).length === 0) {
    throw new Error('Invalid character data: received empty object from API');
  }

  // Add defensive checks for nested properties
  const personality = apiData.personality || {};
  const voice = apiData.voice || {};
  const background = apiData.background || {};
  const metadata = apiData.metadata || {};

  return {
    id: apiData.id,
    name: apiData.name,
    avatar: apiData.avatar,
    personality: {
      traits: personality.traits || [],
      humor: personality.humor || 50,
      formality: personality.formality || 50,
      enthusiasm: personality.enthusiasm || 50,
      empathy: personality.empathy || 50,
      quirks: personality.quirks || [],
    },
    voice: {
      tone: voice.tone || 'friendly',
      vocabulary: voice.vocabulary || 'moderate',
      sentenceStructure: voice.sentenceStructure || 'varied',
      speechPatterns: voice.speechPatterns || [],
      languageStyle: voice.catchphrases?.join(', '),
    },
    catchphrases: voice.catchphrases || [],
    background: background.culturalBackground || apiData.description,
    relationships: [],
    memoryAnchors: [],
    stats: {
      messagesGenerated: 0,
      lastUsed: new Date().toISOString(),
      popularityScore: 0,
    },
    createdAt: metadata.createdAt 
      ? (typeof metadata.createdAt === 'string' 
          ? metadata.createdAt 
          : new Date(metadata.createdAt).toISOString())
      : new Date().toISOString(),
    updatedAt: metadata.updatedAt
      ? (typeof metadata.updatedAt === 'string'
          ? metadata.updatedAt
          : new Date(metadata.updatedAt).toISOString())
      : new Date().toISOString(),
  }
}

export function mapAPIResponseArray(apiData: APICharacterProfile[]): Character[] {
  if (!apiData || !Array.isArray(apiData)) {
    return [];
  }
  
  return apiData
    .filter(item => item != null) // Filter out null/undefined items
    .map(mapAPIResponseToCharacter);
}