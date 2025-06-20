import { apiClient } from './client'
import { Character, ApiResponse } from '@/types/api.types'

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

  async getAll(filters?: CharacterFilters): Promise<Character[]> {
    const response = await apiClient.get<Character[]>(this.basePath, {
      params: filters,
    })
    return response.data || []
  }

  async getById(id: string): Promise<Character> {
    const response = await apiClient.get<Character>(`${this.basePath}/${id}`)
    if (!response.data) {
      throw new Error('Character not found')
    }
    return response.data
  }

  async create(data: CreateCharacterDto): Promise<Character> {
    const response = await apiClient.post<Character>(this.basePath, data)
    if (!response.data) {
      throw new Error('Failed to create character')
    }
    return response.data
  }

  async update(data: UpdateCharacterDto): Promise<Character> {
    const { id, ...updateData } = data
    const response = await apiClient.put<Character>(
      `${this.basePath}/${id}`,
      updateData
    )
    if (!response.data) {
      throw new Error('Failed to update character')
    }
    return response.data
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
    if (!response.data?.url) {
      throw new Error('Failed to upload avatar')
    }
    return response.data.url
  }

  async generateSample(
    characterId: string,
    prompt: string
  ): Promise<{ content: string }> {
    const response = await apiClient.post<{ content: string }>(
      `${this.basePath}/${characterId}/generate-sample`,
      { prompt }
    )
    if (!response.data) {
      throw new Error('Failed to generate sample')
    }
    return response.data
  }

  async getStats(characterId: string): Promise<Character['stats']> {
    const response = await apiClient.get<Character['stats']>(
      `${this.basePath}/${characterId}/stats`
    )
    if (!response.data) {
      throw new Error('Failed to get character stats')
    }
    return response.data
  }

  async duplicate(characterId: string, name: string): Promise<Character> {
    const response = await apiClient.post<Character>(
      `${this.basePath}/${characterId}/duplicate`,
      { name }
    )
    if (!response.data) {
      throw new Error('Failed to duplicate character')
    }
    return response.data
  }

  async export(characterId: string): Promise<Blob> {
    const response = await apiClient.get(
      `${this.basePath}/${characterId}/export`,
      {
        responseType: 'blob',
      }
    )
    return response.data as Blob
  }

  async import(file: File): Promise<Character> {
    const response = await apiClient.uploadFile<Character>(
      `${this.basePath}/import`,
      file
    )
    if (!response.data) {
      throw new Error('Failed to import character')
    }
    return response.data
  }
}

export const characterService = new CharacterService()