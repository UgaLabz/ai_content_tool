import { apiClient } from './client'
import {
  GenerationRequest,
  GenerationResponse,
  Model,
} from '@/types/api.types'

export interface StreamChunk {
  id: string
  content: string
  done: boolean
  error?: string
}

class GenerationService {
  private basePath = '/generate'

  async generateText(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    const response = await apiClient.post<GenerationResponse>(
      `${this.basePath}/text`,
      request
    )
    if (!response.data) {
      throw new Error('Failed to generate content')
    }
    return response.data
  }

  // Simplified generate method for component use
  async generate(
    request: Partial<GenerationRequest>
  ): Promise<GenerationResponse> {
    return this.generateText(request as GenerationRequest)
  }

  async *generateStream(
    request: GenerationRequest
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const stream = apiClient.streamPost<StreamChunk>(
      `${this.basePath}/stream`,
      request
    )
    
    for await (const chunk of stream) {
      yield chunk
    }
  }

  async getModels(): Promise<Model[]> {
    const response = await apiClient.get<Model[]>('/models')
    return response.data || []
  }

  async getActiveModel(): Promise<Model> {
    const response = await apiClient.get<Model>('/models/active')
    if (!response.data) {
      throw new Error('No active model found')
    }
    return response.data
  }

  async estimateTokens(text: string): Promise<{ tokens: number }> {
    const response = await apiClient.post<{ tokens: number }>(
      `${this.basePath}/estimate-tokens`,
      { text }
    )
    if (!response.data) {
      throw new Error('Failed to estimate tokens')
    }
    return response.data
  }

  async cancelGeneration(generationId: string): Promise<void> {
    await apiClient.post(`${this.basePath}/${generationId}/cancel`)
  }

  async getGenerationHistory(
    filters?: {
      characterId?: string
      limit?: number
      offset?: number
      startDate?: string
      endDate?: string
    }
  ): Promise<GenerationResponse[]> {
    const response = await apiClient.get<GenerationResponse[]>(
      `${this.basePath}/history`,
      { params: filters }
    )
    return response.data || []
  }

  async retryGeneration(
    generationId: string,
    modifications?: Partial<GenerationRequest>
  ): Promise<GenerationResponse> {
    const response = await apiClient.post<GenerationResponse>(
      `${this.basePath}/${generationId}/retry`,
      modifications
    )
    if (!response.data) {
      throw new Error('Failed to retry generation')
    }
    return response.data
  }

  async rateGeneration(
    generationId: string,
    rating: number,
    feedback?: string
  ): Promise<void> {
    await apiClient.post(`${this.basePath}/${generationId}/rate`, {
      rating,
      feedback,
    })
  }
}

export const generationService = new GenerationService()