import { 
  CharacterProfile, 
  CharacterContext,
  CharacterResponse,
  ConsistencyScore 
} from '../../models/character';
import { CharacterProfileManager } from './CharacterProfileManager';
import { PromptTemplateEngine } from './PromptTemplateEngine';
import { ConsistencyScorer } from './ConsistencyScorer';
import { LLMProvider } from '../../models/types';
import { GenerationOptions } from '../../models/generation';
import { logger } from '../../utils/logger';

export interface CharacterServiceConfig {
  dataPath?: string;
  consistencyThreshold?: number;
  memoryRetentionDays?: number;
}

export interface CharacterGenerationOptions extends GenerationOptions {
  characterId: string;
  context?: CharacterContext;
  enforceConsistency?: boolean;
  includeMemories?: boolean;
  memoryCount?: number;
}

export class CharacterService {
  private profileManager: CharacterProfileManager;
  private templateEngine: PromptTemplateEngine;
  private consistencyScorer: ConsistencyScorer;
  private config: Required<CharacterServiceConfig>;
  
  constructor(config?: CharacterServiceConfig) {
    this.config = {
      dataPath: config?.dataPath || './data/characters',
      consistencyThreshold: config?.consistencyThreshold || 70,
      memoryRetentionDays: config?.memoryRetentionDays || 30,
    };
    
    this.profileManager = new CharacterProfileManager(this.config.dataPath);
    this.templateEngine = new PromptTemplateEngine();
    this.consistencyScorer = new ConsistencyScorer();
  }
  
  async initialize(): Promise<void> {
    await this.profileManager.initialize();
    logger.info('Character service initialized');
  }
  
  /**
   * Generate a response using a character profile
   */
  async generateWithCharacter(
    provider: LLMProvider,
    prompt: string,
    options: CharacterGenerationOptions
  ): Promise<CharacterResponse> {
    // Get character profile
    const character = await this.profileManager.getProfile(options.characterId);
    if (!character) {
      throw new Error(`Character not found: ${options.characterId}`);
    }
    
    // Prepare context
    const context = await this.prepareContext(character, options.context, options);
    
    // Generate character-aware prompt
    const modelName = provider.modelInfo?.id || 'unknown';
    const characterPrompt = this.templateEngine.generatePrompt(
      character,
      context,
      prompt,
      modelName,
      {
        includeMemories: options.includeMemories !== false,
        memoryCount: options.memoryCount || 5,
        includePersonality: true,
        includeBackground: true,
        style: 'balanced',
      }
    );
    
    // Generate response
    const startTime = Date.now();
    const response = await provider.generateText(characterPrompt, {
      ...options,
      // Character system uses the full prompt, not system+user separation
      systemPrompt: undefined,
    });
    const generationTime = Date.now() - startTime;
    
    // Score consistency
    const consistencyScore = this.consistencyScorer.scoreResponse(
      response,
      character,
      {
        recentResponses: context.recentResponses,
        currentMood: context.currentMood?.primary,
        recentMemories: context.recentMemories,
      }
    );
    
    // Store interaction as memory
    await this.storeInteractionMemory(character.id, prompt, response, consistencyScore);
    
    // Retry if consistency is too low and enforcement is enabled
    if (options.enforceConsistency && consistencyScore.overall < this.config.consistencyThreshold) {
      logger.warn({
        characterId: character.id,
        score: consistencyScore.overall,
        threshold: this.config.consistencyThreshold,
      }, 'Response below consistency threshold, retrying');
      
      // Add consistency feedback to prompt
      const refinedPrompt = this.addConsistencyFeedback(characterPrompt, consistencyScore);
      const refinedResponse = await provider.generateText(refinedPrompt, options);
      
      // Re-score
      const refinedScore = this.consistencyScorer.scoreResponse(
        refinedResponse,
        character,
        context
      );
      
      return {
        content: refinedResponse,
        characterId: character.id,
        consistency: refinedScore,
        metadata: {
          generationTime: Date.now() - startTime,
          modelUsed: modelName,
          retriedForConsistency: true,
          originalScore: consistencyScore.overall,
        },
      };
    }
    
    return {
      content: response,
      characterId: character.id,
      consistency: consistencyScore,
      metadata: {
        generationTime,
        modelUsed: modelName,
        retriedForConsistency: false,
      },
    };
  }
  
  /**
   * Prepare context for character generation
   */
  private async prepareContext(
    character: CharacterProfile,
    providedContext?: Partial<CharacterContext>,
    options?: CharacterGenerationOptions
  ): Promise<CharacterContext> {
    // Get recent memories
    const recentMemories = await this.profileManager.getRecentMemories(
      character.id,
      options?.memoryCount || 10
    );
    
    // Get recent responses from interaction memories
    const interactionMemories = await this.profileManager.getRecentMemories(
      character.id,
      5,
      ['interaction']
    );
    
    const recentResponses = interactionMemories
      .map(m => m.content.split('Assistant: ')[1])
      .filter(Boolean);
    
    return {
      recentMemories,
      recentResponses,
      currentMood: providedContext?.currentMood,
      activeGoals: providedContext?.activeGoals || [],
      environment: providedContext?.environment || {},
      timeContext: new Date(),
    };
  }
  
  /**
   * Store interaction as memory
   */
  private async storeInteractionMemory(
    characterId: string,
    prompt: string,
    response: string,
    consistency: ConsistencyScore
  ): Promise<void> {
    await this.profileManager.addMemory(characterId, {
      type: 'interaction',
      content: `User: ${prompt}\nAssistant: ${response}`,
      associatedEntities: this.extractEntities(prompt + ' ' + response),
      emotionalValence: this.analyzeEmotionalValence(response),
      importance: Math.max(50, consistency.overall),
      retentionPriority: consistency.overall > 80 ? 'high' : 'medium',
    });
  }
  
  /**
   * Add consistency feedback to prompt for retry
   */
  private addConsistencyFeedback(
    originalPrompt: string,
    consistencyScore: ConsistencyScore
  ): string {
    const feedback = [
      '\n\n[Consistency Feedback]',
      'Please adjust your response to better match the character:',
    ];
    
    if (consistencyScore.personality < 70) {
      feedback.push('- Ensure personality traits are reflected more clearly');
    }
    if (consistencyScore.voice < 70) {
      feedback.push('- Match the established voice and communication style');
    }
    if (consistencyScore.knowledge < 70) {
      feedback.push('- Stay within knowledge boundaries and expertise');
    }
    if (consistencyScore.emotional < 70) {
      feedback.push('- Maintain emotional consistency');
    }
    
    if (consistencyScore.details && consistencyScore.details.length > 0) {
      feedback.push('\nSpecific issues:');
      feedback.push(...consistencyScore.details.map(d => `- ${d}`));
    }
    
    return originalPrompt + feedback.join('\n');
  }
  
  /**
   * Simple entity extraction (in production, use NLP)
   */
  private extractEntities(text: string): string[] {
    // Extract capitalized words as potential entities
    const words = text.split(/\s+/);
    const entities = new Set<string>();
    
    for (const word of words) {
      if (word.length > 2 && /^[A-Z]/.test(word)) {
        entities.add(word.replace(/[.,!?;:]$/, ''));
      }
    }
    
    return Array.from(entities);
  }
  
  /**
   * Analyze emotional valence of text
   */
  private analyzeEmotionalValence(text: string): number {
    const positive = ['happy', 'excited', 'great', 'wonderful', 'excellent', 'love'];
    const negative = ['sad', 'angry', 'terrible', 'awful', 'hate', 'disappointed'];
    
    const textLower = text.toLowerCase();
    let score = 0;
    
    for (const word of positive) {
      if (textLower.includes(word)) score += 10;
    }
    
    for (const word of negative) {
      if (textLower.includes(word)) score -= 10;
    }
    
    return Math.max(-100, Math.min(100, score));
  }
  
  // Profile management delegation
  
  async createProfile(profile: Omit<CharacterProfile, 'metadata'>): Promise<CharacterProfile> {
    return this.profileManager.createProfile(profile);
  }
  
  async updateProfile(id: string, updates: Partial<CharacterProfile>): Promise<CharacterProfile> {
    return this.profileManager.updateProfile(id, updates);
  }
  
  async getProfile(id: string): Promise<CharacterProfile | null> {
    return this.profileManager.getProfile(id);
  }
  
  async getAllProfiles(): Promise<CharacterProfile[]> {
    return this.profileManager.getAllProfiles();
  }
  
  async deleteProfile(id: string): Promise<void> {
    return this.profileManager.deleteProfile(id);
  }
  
  async addMemory(characterId: string, memory: Omit<CharacterMemory, 'id' | 'timestamp'>): Promise<void> {
    return this.profileManager.addMemory(characterId, memory);
  }
  
  async getRecentMemories(
    characterId: string, 
    count?: number, 
    types?: string[]
  ): Promise<CharacterMemory[]> {
    return this.profileManager.getRecentMemories(characterId, count, types);
  }
  
  async searchMemories(
    characterId: string,
    query: string,
    options?: {
      types?: string[];
      minImportance?: number;
      limit?: number;
    }
  ): Promise<CharacterMemory[]> {
    return this.profileManager.searchMemories(characterId, query, options);
  }
  
  // Template management
  
  getPromptTemplates() {
    return this.templateEngine.getAllTemplates();
  }
  
  addPromptTemplate(template: Parameters<PromptTemplateEngine['addTemplate']>[0]) {
    return this.templateEngine.addTemplate(template);
  }
}