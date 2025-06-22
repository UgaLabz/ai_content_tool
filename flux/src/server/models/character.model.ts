import { db } from '../db/config'
import { 
  Character, 
  CharacterImage, 
  CreateCharacterRequest,
  UpdateCharacterRequest,
  CharacterWithImages,
  GenerationHistory,
  LoraModel,
  StylePreset
} from '../types/character'

export class CharacterModel {
  // Character CRUD operations
  static async create(data: CreateCharacterRequest): Promise<Character> {
    const [id] = await db('characters').insert({
      ...data,
      tags: JSON.stringify(data.tags || [])
    })
    
    return this.findById(id)
  }

  static async findAll(): Promise<Character[]> {
    const characters = await db('characters').select('*').orderBy('created_at', 'desc')
    return characters.map(char => ({
      ...char,
      tags: JSON.parse(char.tags || '[]')
    }))
  }

  static async findById(id: number): Promise<Character> {
    const character = await db('characters').where({ id }).first()
    if (!character) {
      throw new Error(`Character with id ${id} not found`)
    }
    return {
      ...character,
      tags: JSON.parse(character.tags || '[]')
    }
  }

  static async findByIdWithImages(id: number): Promise<CharacterWithImages> {
    const character = await this.findById(id)
    const images = await db('character_images')
      .where({ character_id: id })
      .orderBy('created_at', 'desc')
    
    const primary_image = images.find(img => img.is_primary) || images[0]
    
    return {
      ...character,
      images: images.map(img => ({
        ...img,
        parameters: JSON.parse(img.parameters || '{}')
      })),
      primary_image: primary_image ? {
        ...primary_image,
        parameters: JSON.parse(primary_image.parameters || '{}')
      } : undefined
    }
  }

  static async update(id: number, data: Partial<UpdateCharacterRequest>): Promise<Character> {
    const updateData = { ...data }
    if (data.tags) {
      updateData.tags = JSON.stringify(data.tags) as any
    }
    
    await db('characters')
      .where({ id })
      .update({
        ...updateData,
        updated_at: db.fn.now()
      })
    
    return this.findById(id)
  }

  static async delete(id: number): Promise<void> {
    await db('characters').where({ id }).delete()
  }

  // Character image operations
  static async addImage(characterId: number, imagePath: string, data?: {
    thumbnail_path?: string
    prompt_used?: string
    parameters?: any
    is_primary?: boolean
  }): Promise<CharacterImage> {
    // If setting as primary, unset other primary images
    if (data?.is_primary) {
      await db('character_images')
        .where({ character_id: characterId })
        .update({ is_primary: false })
    }

    const [id] = await db('character_images').insert({
      character_id: characterId,
      image_path: imagePath,
      thumbnail_path: data?.thumbnail_path,
      prompt_used: data?.prompt_used,
      parameters: JSON.stringify(data?.parameters || {}),
      is_primary: data?.is_primary || false
    })

    return db('character_images').where({ id }).first()
  }

  static async setPrimaryImage(characterId: number, imageId: number): Promise<void> {
    await db('character_images')
      .where({ character_id: characterId })
      .update({ is_primary: false })
    
    await db('character_images')
      .where({ id: imageId, character_id: characterId })
      .update({ is_primary: true })
  }

  static async deleteImage(imageId: number): Promise<void> {
    await db('character_images').where({ id: imageId }).delete()
  }

  // Generation history
  static async addToHistory(data: {
    character_id?: number
    image_path: string
    prompt?: string
    parameters?: any
    workflow_type?: string
  }): Promise<GenerationHistory> {
    const [id] = await db('generation_history').insert({
      ...data,
      parameters: JSON.stringify(data.parameters || {})
    })

    return db('generation_history').where({ id }).first()
  }

  static async getHistory(characterId?: number, limit: number = 50): Promise<GenerationHistory[]> {
    let query = db('generation_history').orderBy('generated_at', 'desc').limit(limit)
    
    if (characterId) {
      query = query.where({ character_id: characterId })
    }

    const history = await query
    return history.map(item => ({
      ...item,
      parameters: JSON.parse(item.parameters || '{}')
    }))
  }

  // LoRA model operations
  static async addLoraModel(data: {
    name: string
    file_path: string
    trigger_words?: string
    description?: string
    base_model?: string
    metadata?: any
  }): Promise<LoraModel> {
    const [id] = await db('lora_models').insert({
      ...data,
      metadata: JSON.stringify(data.metadata || {})
    })

    return db('lora_models').where({ id }).first()
  }

  static async getLoraModels(): Promise<LoraModel[]> {
    const models = await db('lora_models').orderBy('created_at', 'desc')
    return models.map(model => ({
      ...model,
      metadata: JSON.parse(model.metadata || '{}')
    }))
  }

  // Style preset operations
  static async addStylePreset(characterId: number, data: {
    name: string
    style_prompt?: string
    parameters?: any
  }): Promise<StylePreset> {
    const [id] = await db('style_presets').insert({
      character_id: characterId,
      ...data,
      parameters: JSON.stringify(data.parameters || {})
    })

    return db('style_presets').where({ id }).first()
  }

  static async getStylePresets(characterId: number): Promise<StylePreset[]> {
    const presets = await db('style_presets')
      .where({ character_id: characterId })
      .orderBy('created_at', 'desc')
    
    return presets.map(preset => ({
      ...preset,
      parameters: JSON.parse(preset.parameters || '{}')
    }))
  }
}