export { apiClient } from './client'
export { characterService } from './characters'
export { generationService } from './generation'

// Re-export types
export type {
  CreateCharacterDto,
  UpdateCharacterDto,
  CharacterFilters,
} from './characters'

export type { StreamChunk } from './generation'