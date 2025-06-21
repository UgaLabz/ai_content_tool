import { apiClient } from './client'
import type { Character } from '@/types/api.types'

export interface GenerationOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  enforceConsistency?: boolean
  includeMemories?: boolean
  memoryCount?: number
}

export interface GenerationContext {
  currentMood?: {
    primary: string
    secondary?: string[]
    intensity: number
  }
  activeGoals?: string[]
  environment?: Record<string, any>
}

export interface GenerationRequest {
  prompt: string
  characterId: string
  options?: GenerationOptions
  context?: GenerationContext
}

export interface GenerationResponse {
  content: string
  characterId: string
  consistency: {
    overall: number
    personality: number
    voice: number
    knowledge: number
    emotional: number
    details: string[]
  }
  metadata: {
    generationTime: number
    modelUsed: string
    retriedForConsistency: boolean
    originalScore: number
  }
  providerId: string
  modelId: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export const generationService = {
  /**
   * Generate content using a character profile
   */
  async generateWithCharacter(request: GenerationRequest): Promise<GenerationResponse> {
    console.log('Sending generation request:', request)
    const response = await apiClient.post<GenerationResponse>('/generate/character', request)
    console.log('Generation response:', response.data)
    return response.data
  },

  /**
   * Generate a meme with a character
   */
  async generateMeme(character: Character, prompt: string, template?: string): Promise<GenerationResponse> {
    const memePrompt = `Create a funny meme text for a ${template || 'meme'} template. ${prompt}
    
Make it witty, relatable, and in character. Keep the text short and punchy - perfect for a meme format.
Top text and bottom text should work together for comedic effect.`

    return this.generateWithCharacter({
      prompt: memePrompt,
      characterId: character.id,
      options: {
        temperature: 0.8,
        maxTokens: 150,
        enforceConsistency: true,
      },
      context: {
        currentMood: {
          primary: 'humorous',
          secondary: ['creative', 'witty'],
          intensity: 80
        }
      }
    })
  },

  /**
   * Generate a video script with a character
   */
  async generateVideoScript(character: Character, prompt: string, duration: number): Promise<GenerationResponse> {
    const scriptPrompt = `Create a ${duration}-second video script. ${prompt}

Format the script with:
- Hook (0-3 seconds): Attention-grabbing opening
- Main Content (${Math.floor(duration * 0.7)} seconds): Core message
- Call to Action (final ${Math.floor(duration * 0.2)} seconds): Engagement prompt

Include visual notes and timing markers. Make it engaging and in character.`

    return this.generateWithCharacter({
      prompt: scriptPrompt,
      characterId: character.id,
      options: {
        temperature: 0.7,
        maxTokens: 500,
        enforceConsistency: true,
      },
      context: {
        currentMood: {
          primary: 'engaging',
          secondary: ['creative', 'dynamic'],
          intensity: 75
        }
      }
    })
  },

  /**
   * Generate a social media post with a character
   */
  async generateSocialPost(character: Character, prompt: string, platform: string): Promise<GenerationResponse> {
    const platformLimits: Record<string, string> = {
      'twitter': '280 characters',
      'linkedin': 'professional tone, 1-2 paragraphs',
      'instagram': 'engaging caption with relevant hashtags'
    }

    const socialPrompt = `Create a ${platform} post. ${prompt}

Requirements: ${platformLimits[platform.toLowerCase()] || 'appropriate length'}
Make it engaging, shareable, and true to character voice.`

    return this.generateWithCharacter({
      prompt: socialPrompt,
      characterId: character.id,
      options: {
        temperature: 0.75,
        maxTokens: 300,
        enforceConsistency: true,
      },
      context: {
        currentMood: {
          primary: 'social',
          secondary: ['engaging', 'authentic'],
          intensity: 70
        }
      }
    })
  }
}