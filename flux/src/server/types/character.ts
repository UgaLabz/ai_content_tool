export interface Character {
  id: number
  name: string
  description?: string
  base_prompt: string
  negative_prompt?: string
  tags?: string[]
  lora_path?: string
  lora_strength?: number
  created_at: Date
  updated_at: Date
}

export interface CharacterImage {
  id: number
  character_id: number
  image_path: string
  thumbnail_path?: string
  prompt_used?: string
  parameters?: GenerationParameters
  is_primary: boolean
  created_at: Date
  updated_at: Date
}

export interface GenerationHistory {
  id: number
  character_id?: number
  image_path: string
  prompt?: string
  parameters?: GenerationParameters
  workflow_type?: string
  generated_at: Date
}

export interface LoraModel {
  id: number
  name: string
  file_path: string
  trigger_words?: string
  description?: string
  base_model: string
  metadata?: Record<string, any>
  created_at: Date
  updated_at: Date
}

export interface StylePreset {
  id: number
  character_id: number
  name: string
  style_prompt?: string
  parameters?: Partial<GenerationParameters>
  created_at: Date
  updated_at: Date
}

export interface GenerationParameters {
  width: number
  height: number
  steps: number
  seed: number
  sampler: string
  scheduler: string
  cfg_scale?: number
  denoise?: number
}

// API request/response types
export interface CreateCharacterRequest {
  name: string
  description?: string
  base_prompt: string
  negative_prompt?: string
  tags?: string[]
  lora_path?: string
  lora_strength?: number
}

export interface UpdateCharacterRequest extends Partial<CreateCharacterRequest> {
  id: number
}

export interface CharacterWithImages extends Character {
  images: CharacterImage[]
  primary_image?: CharacterImage
}