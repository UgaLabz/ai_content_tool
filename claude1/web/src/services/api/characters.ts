import { apiClient } from './client'
import type { Character } from '@/types/api.types'
import { mapToAPIFormat } from './character-mapper'
import { mapAPIResponseArray, mapAPIResponseToCharacter } from './character-response-mapper'

export interface CreateCharacterDto {
  name: string
  avatar?: string
  personality: {
    traits: string[]
    humor: number
    formality: number
    enthusiasm: number
    empathy: number
    quirks?: string[]
  }
  voice: {
    tone: string
    vocabulary: string
    sentenceStructure: string
    speechPatterns?: string[]
    languageStyle?: string
  }
  catchphrases?: string[]
  background?: string
  relationships?: {
    characterId: string
    type: 'friend' | 'rival' | 'mentor' | 'student' | 'family' | 'colleague'
    description: string
  }[]
}

export interface UpdateCharacterDto extends Partial<CreateCharacterDto> {
  id: string
}

export interface CharacterFilters {
  search?: string
  tags?: string[]
  sortBy?: 'name' | 'createdAt' | 'lastUsed' | 'popularity'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

class CharacterService {
  private basePath = '/characters'

  constructor() {
    // Bind all methods to preserve 'this' context
    this.getAll = this.getAll.bind(this)
    this.getById = this.getById.bind(this)
    this.create = this.create.bind(this)
    this.update = this.update.bind(this)
    this.delete = this.delete.bind(this)
    this.duplicate = this.duplicate.bind(this)
    this.uploadAvatar = this.uploadAvatar.bind(this)
    this.generateSample = this.generateSample.bind(this)
    this.export = this.export.bind(this)
    this.import = this.import.bind(this)
  }

  async getAll(filters?: CharacterFilters): Promise<Character[]> {
    try {
      const response = await apiClient.get<any[]>(this.basePath, {
        params: filters,
      })
      if (!response || !Array.isArray(response)) {
        return []
      }
      return mapAPIResponseArray(response)
    } catch (error) {
      console.error('Error fetching characters:', error)
      return []
    }
  }

  async getById(id: string): Promise<Character> {
    const response = await apiClient.get<any>(`${this.basePath}/${id}`)
    if (!response) {
      throw new Error('Character not found')
    }
    
    // Workaround: If API returns empty object, fetch all characters and find the one we need
    if (Object.keys(response).length === 0) {
      console.log('API returned empty object for character, fetching from list instead')
      const allCharacters = await this.getAll()
      const character = allCharacters.find(c => c.id === id)
      if (!character) {
        throw new Error('Character not found')
      }
      return character
    }
    
    return mapAPIResponseToCharacter(response)
  }

  async create(data: CreateCharacterDto): Promise<Character> {
    // Ensure avatar is not too large (limit to ~100KB base64)
    if (data.avatar && data.avatar.length > 100000) {
      console.warn('Avatar image too large, will be compressed on server')
    }
    
    console.log('Creating character with path:', this.basePath)
    console.log('Character data:', data)
    
    // Map to API format
    const apiData = mapToAPIFormat(data)
    console.log('Mapped API data:', apiData)
    
    const response = await apiClient.post<any>(this.basePath, apiData)
    if (!response) {
      throw new Error('Failed to create character')
    }
    
    // If API returns empty object, just return success
    // The mutation will invalidate cache and refetch
    if (Object.keys(response).length === 0) {
      console.log('API returned empty object, character was likely created successfully')
      // Return a minimal character object
      return {
        ...data,
        id: 'temp-' + Date.now(), // Temporary ID
        stats: {
          totalGenerations: 0,
          totalTokens: 0,
          averageResponseTime: 0,
          lastUsed: new Date().toISOString(),
          favoriteTopics: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Character
    }
    
    return mapAPIResponseToCharacter(response)
  }

  async update(id: string, data: Partial<CreateCharacterDto>): Promise<Character> {
    const response = await apiClient.put<Character>(
      `${this.basePath}/${id}`,
      data
    )
    if (!response) {
      throw new Error('Failed to update character')
    }
    return response
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`)
  }

  async uploadAvatar(
    characterId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const response = await apiClient.uploadFile<{ url: string }>(
      `${this.basePath}/${characterId}/avatar`,
      file,
      undefined,
      onProgress
    )
    if (!response?.url) {
      throw new Error('Failed to upload avatar')
    }
    return response.url
  }

  async generateSample(
    characterId: string,
    prompt: string
  ): Promise<{ content: string }> {
    const response = await apiClient.post<{ content: string }>(
      `${this.basePath}/${characterId}/generate-sample`,
      { prompt }
    )
    if (!response) {
      throw new Error('Failed to generate sample')
    }
    return response
  }

  async getStats(characterId: string): Promise<Character['stats']> {
    const response = await apiClient.get<Character['stats']>(
      `${this.basePath}/${characterId}/stats`
    )
    if (!response) {
      throw new Error('Failed to get character stats')
    }
    return response
  }

  async duplicate(characterId: string, name: string): Promise<Character> {
    const response = await apiClient.post<Character>(
      `${this.basePath}/${characterId}/duplicate`,
      { name }
    )
    if (!response) {
      throw new Error('Failed to duplicate character')
    }
    return response
  }

  async generateWithCharacter(
    characterId: string, 
    params: {
      prompt: string
      options?: {
        temperature?: number
        maxTokens?: number
        topP?: number
        enforceConsistency?: boolean
        includeMemories?: boolean
        memoryCount?: number
      }
      context?: {
        currentMood?: {
          primary: string
          secondary?: string[]
          intensity: number
        }
        activeGoals?: string[]
        environment?: Record<string, any>
      }
    }
  ): Promise<{
    content: string
    characterId: string
    consistency?: {
      overall: number
      personality: number
      voice: number
      knowledge: number
      emotional: number
      details: string[]
    }
    metadata?: {
      generationTime: number
      modelUsed: string
      retriedForConsistency: boolean
      originalScore: number
    }
  }> {
    const response = await apiClient.post(
      '/generate/character',
      {
        ...params,
        characterId
      }
    )
    if (!response) {
      throw new Error('Failed to generate with character')
    }
    return response
  }

  async export(characterId: string): Promise<Blob> {
    const response = await apiClient.get(
      `${this.basePath}/${characterId}/export`,
      {
        responseType: 'blob',
      }
    )
    return response as Blob
  }

  async import(file: File): Promise<Character> {
    const response = await apiClient.uploadFile<Character>(
      `${this.basePath}/import`,
      file
    )
    if (!response) {
      throw new Error('Failed to import character')
    }
    return response
  }
}

export const characterService = new CharacterService()