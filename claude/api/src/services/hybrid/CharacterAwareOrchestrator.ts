import { ConfigurableOrchestrator } from './ConfigurableOrchestrator';
import { CharacterService, CharacterGenerationOptions } from '../character/CharacterService';
import { GenerationTask, GenerationResult, ProviderSelectionResult } from '../../models/generation';
import { CharacterResponse } from '../../models/character';
import { logger } from '../../utils/logger';

export interface CharacterAwareGenerationTask extends GenerationTask {
  characterId?: string;
  characterOptions?: Partial<CharacterGenerationOptions>;
}

export interface CharacterAwareGenerationResult extends GenerationResult {
  characterResponse?: CharacterResponse;
}

export class CharacterAwareOrchestrator extends ConfigurableOrchestrator {
  private characterService: CharacterService;
  
  constructor(
    config?: ConstructorParameters<typeof ConfigurableOrchestrator>[0],
    characterServiceConfig?: ConstructorParameters<typeof CharacterService>[0]
  ) {
    super(config);
    this.characterService = new CharacterService(characterServiceConfig);
  }
  
  async initialize(): Promise<void> {
    await super.initialize();
    await this.characterService.initialize();
    logger.info('Character-aware orchestrator initialized');
  }
  
  /**
   * Generate with optional character support
   */
  async generate(task: CharacterAwareGenerationTask): Promise<CharacterAwareGenerationResult> {
    // If no character specified, use regular generation
    if (!task.characterId) {
      return super.generate(task);
    }
    
    // Get character profile
    const character = await this.characterService.getProfile(task.characterId);
    if (!character) {
      throw new Error(`Character not found: ${task.characterId}`);
    }
    
    // Select provider based on task and character requirements
    const selection = await this.selectProvider(task);
    const provider = selection.provider;
    
    logger.info({
      taskId: task.id,
      characterId: task.characterId,
      characterName: character.name,
      provider: selection.providerId,
      model: selection.modelId,
    }, 'Generating character response');
    
    try {
      // Generate with character
      const characterResponse = await this.characterService.generateWithCharacter(
        provider,
        task.prompt,
        {
          ...task.options,
          ...task.characterOptions,
          characterId: task.characterId,
          maxTokens: task.options?.maxTokens,
          temperature: task.options?.temperature,
          topP: task.options?.topP,
          stream: false, // Character responses don't support streaming yet
        }
      );
      
      // Record performance
      await this.performanceTracker.recordGeneration(
        selection.providerId,
        selection.modelId || 'unknown',
        {
          promptTokens: task.prompt.length / 4, // Approximate
          completionTokens: characterResponse.content.length / 4,
          totalTokens: (task.prompt.length + characterResponse.content.length) / 4,
          latencyMs: characterResponse.metadata.generationTime,
          success: true,
          characterId: task.characterId,
          consistencyScore: characterResponse.consistency.overall,
        }
      );
      
      return {
        content: characterResponse.content,
        providerId: selection.providerId,
        modelId: selection.modelId || 'unknown',
        usage: {
          promptTokens: task.prompt.length / 4,
          completionTokens: characterResponse.content.length / 4,
          totalTokens: (task.prompt.length + characterResponse.content.length) / 4,
        },
        latency: characterResponse.metadata.generationTime,
        characterResponse,
      };
      
    } catch (error) {
      logger.error({
        taskId: task.id,
        characterId: task.characterId,
        provider: selection.providerId,
        error,
      }, 'Character generation failed');
      
      // Record failure
      await this.performanceTracker.recordGeneration(
        selection.providerId,
        selection.modelId || 'unknown',
        {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          characterId: task.characterId,
        }
      );
      
      // Try fallback without character if consistency not enforced
      if (!task.characterOptions?.enforceConsistency) {
        logger.info({
          taskId: task.id,
          characterId: task.characterId,
        }, 'Falling back to non-character generation');
        
        return super.generate({
          ...task,
          characterId: undefined,
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Override provider selection to consider character requirements
   */
  protected async selectProvider(task: CharacterAwareGenerationTask): Promise<ProviderSelectionResult> {
    if (!task.characterId) {
      return super.selectProvider(task);
    }
    
    const character = await this.characterService.getProfile(task.characterId);
    if (!character) {
      return super.selectProvider(task);
    }
    
    // Adjust task complexity based on character complexity
    const characterComplexity = this.assessCharacterComplexity(character);
    const adjustedTask = {
      ...task,
      // Add character complexity to task requirements
      requirements: {
        ...task.requirements,
        minModelSize: Math.max(
          task.requirements?.minModelSize || 0,
          characterComplexity.minModelSize
        ),
        contextWindow: Math.max(
          task.requirements?.contextWindow || 2048,
          characterComplexity.contextWindow
        ),
      },
    };
    
    return super.selectProvider(adjustedTask);
  }
  
  /**
   * Assess character complexity to determine model requirements
   */
  private assessCharacterComplexity(character: any): {
    minModelSize: number;
    contextWindow: number;
  } {
    let minModelSize = 3; // 3B minimum for character consistency
    let contextWindow = 4096;
    
    // Complex personality requires larger model
    const personalityTraits = character.personality.traits.length;
    if (personalityTraits > 5) minModelSize = 7;
    if (personalityTraits > 10) minModelSize = 13;
    
    // Multiple knowledge domains require more context
    const knowledgeDomains = character.knowledge.length;
    if (knowledgeDomains > 3) contextWindow = 8192;
    if (knowledgeDomains > 5) contextWindow = 16384;
    
    // Rich background requires larger model
    const hasRichBackground = 
      character.background.experiences.length > 3 ||
      character.background.expertise.length > 3;
    if (hasRichBackground) {
      minModelSize = Math.max(minModelSize, 7);
    }
    
    // Many memories require more context
    if (character.memories.length > 50) {
      contextWindow = Math.max(contextWindow, 8192);
    }
    
    return { minModelSize, contextWindow };
  }
  
  // Delegate character management methods
  
  async createCharacter(profile: Parameters<CharacterService['createProfile']>[0]) {
    return this.characterService.createProfile(profile);
  }
  
  async updateCharacter(id: string, updates: Parameters<CharacterService['updateProfile']>[1]) {
    return this.characterService.updateProfile(id, updates);
  }
  
  async getCharacter(id: string) {
    return this.characterService.getProfile(id);
  }
  
  async getAllCharacters() {
    return this.characterService.getAllProfiles();
  }
  
  async deleteCharacter(id: string) {
    return this.characterService.deleteProfile(id);
  }
  
  async addCharacterMemory(
    characterId: string, 
    memory: Parameters<CharacterService['addMemory']>[1]
  ) {
    return this.characterService.addMemory(characterId, memory);
  }
  
  async getCharacterMemories(
    characterId: string,
    count?: number,
    types?: string[]
  ) {
    return this.characterService.getRecentMemories(characterId, count, types);
  }
  
  async searchCharacterMemories(
    characterId: string,
    query: string,
    options?: Parameters<CharacterService['searchMemories']>[2]
  ) {
    return this.characterService.searchMemories(characterId, query, options);
  }
}