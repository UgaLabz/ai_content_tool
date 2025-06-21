// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// Character Types
export interface Character {
  id: string
  name: string
  avatar?: string
  personality: CharacterPersonality
  voice: CharacterVoice
  catchphrases: string[]
  background?: string
  relationships?: CharacterRelationship[]
  memoryAnchors?: MemoryAnchor[]
  stats: CharacterStats
  createdAt: string
  updatedAt: string
}

export interface CharacterPersonality {
  traits: string[]
  humor: number // 0-100
  formality: number // 0-100
  enthusiasm: number // 0-100
  empathy: number // 0-100
  quirks?: string[]
}

export interface CharacterVoice {
  tone: string
  vocabulary: string
  sentenceStructure: string
  speechPatterns?: string[]
  languageStyle?: string
}

export interface CharacterRelationship {
  characterId: string
  type: 'friend' | 'rival' | 'mentor' | 'student' | 'family' | 'colleague'
  description: string
}

export interface MemoryAnchor {
  id: string
  type: 'event' | 'belief' | 'goal' | 'fear' | 'experience'
  content: string
  importance: number // 0-100
  context?: string
}

export interface CharacterStats {
  totalGenerations: number
  consistencyScore: number
  popularityScore: number
  lastUsed?: string
}

// Generation Types
export interface GenerationRequest {
  prompt: string
  characterId?: string
  options?: GenerationOptions
  context?: GenerationContext
}

export interface GenerationOptions {
  temperature?: number
  maxTokens?: number
  model?: string
  style?: string
  format?: 'text' | 'json' | 'markdown'
}

export interface GenerationContext {
  previousMessages?: Message[]
  memoryAnchors?: string[]
  relationships?: string[]
}

export interface GenerationResponse {
  id: string
  content: string
  characterId?: string
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  model: string
  createdAt: string
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

// Template Types
export interface Template {
  id: string
  name: string
  description: string
  category: string
  variables: TemplateVariable[]
  content: string
  tags: string[]
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'select' | 'boolean'
  description?: string
  defaultValue?: unknown
  options?: string[] // for select type
  required: boolean
}

// Content Types
export interface Content {
  id: string
  title: string
  content: string
  type: 'text' | 'meme' | 'script' | 'dialogue' | 'other'
  characterId?: string
  templateId?: string
  tags: string[]
  metadata?: ContentMetadata
  version: number
  createdAt: string
  updatedAt: string
}

export interface ContentMetadata {
  format?: string
  wordCount?: number
  sentiment?: string
  keywords?: string[]
  customFields?: Record<string, unknown>
}

// Model Types
export interface Model {
  id: string
  name: string
  provider: string
  type: 'completion' | 'chat' | 'instruct'
  capabilities: string[]
  contextWindow: number
  costPer1kTokens: {
    input: number
    output: number
  }
  status: 'available' | 'unavailable' | 'deprecated'
}