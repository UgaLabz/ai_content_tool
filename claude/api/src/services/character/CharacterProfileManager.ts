import { 
  CharacterProfile, 
  PersonalityTraits, 
  CharacterBackground,
  VoiceStyle,
  KnowledgeDomain,
  CharacterMemory
} from '../../models/character';
import { logger } from '../../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

// Validation schema for character profiles
const CharacterProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  personality: z.object({
    openness: z.number().min(0).max(100),
    conscientiousness: z.number().min(0).max(100),
    extraversion: z.number().min(0).max(100),
    agreeableness: z.number().min(0).max(100),
    neuroticism: z.number().min(0).max(100),
    humor: z.number().min(0).max(100),
    formality: z.number().min(0).max(100),
    empathy: z.number().min(0).max(100),
    creativity: z.number().min(0).max(100),
    analyticalThinking: z.number().min(0).max(100),
    traits: z.array(z.string()),
    quirks: z.array(z.string()),
    values: z.array(z.string()),
  }),
  background: z.object({
    occupation: z.string().optional(),
    education: z.string().optional(),
    origin: z.string().optional(),
    age: z.union([z.number(), z.string()]).optional(),
    interests: z.array(z.string()),
    expertise: z.array(z.string()),
    experiences: z.array(z.string()),
    culturalBackground: z.string().optional(),
  }),
  voice: z.object({
    tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'playful', 'empathetic']),
    vocabulary: z.enum(['simple', 'moderate', 'advanced', 'technical', 'mixed']),
    sentenceStructure: z.enum(['simple', 'complex', 'varied']),
    pacing: z.enum(['slow', 'moderate', 'fast', 'dynamic']),
    speechPatterns: z.array(z.string()),
    catchphrases: z.array(z.string()),
    greetings: z.array(z.string()),
    farewells: z.array(z.string()),
    formalityLevel: z.number().min(0).max(100),
    useOfSlang: z.boolean(),
    useOfTechnicalTerms: z.boolean(),
    preferredPronouns: z.string().optional(),
  }),
  knowledge: z.array(z.object({
    domain: z.string(),
    expertise: z.enum(['basic', 'intermediate', 'advanced', 'expert']),
    confidence: z.number().min(0).max(100),
    limitations: z.array(z.string()),
  })),
  relationships: z.array(z.any()),
  memories: z.array(z.any()),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    version: z.number(),
    tags: z.array(z.string()),
  }),
});

export class CharacterProfileManager {
  private profiles: Map<string, CharacterProfile> = new Map();
  private profilesPath: string;
  private memoriesPath: string;
  
  constructor(dataPath: string = './data/characters') {
    this.profilesPath = path.join(dataPath, 'profiles');
    this.memoriesPath = path.join(dataPath, 'memories');
  }
  
  async initialize(): Promise<void> {
    // Create directories if they don't exist
    await fs.mkdir(this.profilesPath, { recursive: true });
    await fs.mkdir(this.memoriesPath, { recursive: true });
    
    // Load existing profiles
    await this.loadProfiles();
    
    logger.info({ profileCount: this.profiles.size }, 'Character profile manager initialized');
  }
  
  async createProfile(profile: Omit<CharacterProfile, 'metadata'>): Promise<CharacterProfile> {
    const fullProfile: CharacterProfile = {
      ...profile,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: [],
      },
    };
    
    // Validate profile
    const validated = CharacterProfileSchema.parse(fullProfile);
    
    // Save profile
    this.profiles.set(validated.id, validated);
    await this.saveProfile(validated);
    
    logger.info({ characterId: validated.id, name: validated.name }, 'Character profile created');
    
    return validated;
  }
  
  async updateProfile(id: string, updates: Partial<CharacterProfile>): Promise<CharacterProfile> {
    const existing = this.profiles.get(id);
    if (!existing) {
      throw new Error(`Character profile not found: ${id}`);
    }
    
    const updated: CharacterProfile = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      metadata: {
        ...existing.metadata,
        updatedAt: new Date(),
        version: existing.metadata.version + 1,
      },
    };
    
    // Validate updated profile
    const validated = CharacterProfileSchema.parse(updated);
    
    // Save profile
    this.profiles.set(id, validated);
    await this.saveProfile(validated);
    
    logger.info({ characterId: id, version: validated.metadata.version }, 'Character profile updated');
    
    return validated;
  }
  
  async getProfile(id: string): Promise<CharacterProfile | null> {
    return this.profiles.get(id) || null;
  }
  
  async getAllProfiles(): Promise<CharacterProfile[]> {
    return Array.from(this.profiles.values());
  }
  
  async deleteProfile(id: string): Promise<void> {
    if (!this.profiles.has(id)) {
      throw new Error(`Character profile not found: ${id}`);
    }
    
    this.profiles.delete(id);
    
    // Delete profile file
    const profilePath = path.join(this.profilesPath, `${id}.json`);
    await fs.unlink(profilePath).catch(() => {});
    
    // Delete memories directory
    const memoriesDir = path.join(this.memoriesPath, id);
    await fs.rm(memoriesDir, { recursive: true }).catch(() => {});
    
    logger.info({ characterId: id }, 'Character profile deleted');
  }
  
  async addMemory(characterId: string, memory: Omit<CharacterMemory, 'id' | 'timestamp'>): Promise<void> {
    const profile = this.profiles.get(characterId);
    if (!profile) {
      throw new Error(`Character profile not found: ${characterId}`);
    }
    
    const fullMemory: CharacterMemory = {
      ...memory,
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    // Add to profile
    profile.memories.push(fullMemory);
    
    // Limit memory size (keep most recent and important)
    if (profile.memories.length > 1000) {
      profile.memories = this.pruneMemories(profile.memories);
    }
    
    // Save updated profile
    await this.saveProfile(profile);
    
    // Also save memory separately for analysis
    await this.saveMemory(characterId, fullMemory);
    
    logger.debug({ characterId, memoryId: fullMemory.id }, 'Memory added');
  }
  
  async getRecentMemories(
    characterId: string, 
    count: number = 10, 
    types?: string[]
  ): Promise<CharacterMemory[]> {
    const profile = this.profiles.get(characterId);
    if (!profile) {
      return [];
    }
    
    let memories = [...profile.memories];
    
    // Filter by type if specified
    if (types && types.length > 0) {
      memories = memories.filter(m => types.includes(m.type));
    }
    
    // Sort by timestamp (most recent first)
    memories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return memories.slice(0, count);
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
    const profile = this.profiles.get(characterId);
    if (!profile) {
      return [];
    }
    
    const queryLower = query.toLowerCase();
    let memories = profile.memories.filter(m => 
      m.content.toLowerCase().includes(queryLower) ||
      m.associatedEntities.some(e => e.toLowerCase().includes(queryLower))
    );
    
    // Apply filters
    if (options?.types) {
      memories = memories.filter(m => options.types!.includes(m.type));
    }
    
    if (options?.minImportance) {
      memories = memories.filter(m => m.importance >= options.minImportance!);
    }
    
    // Sort by relevance (importance * recency)
    const now = Date.now();
    memories.sort((a, b) => {
      const aScore = a.importance * (1 / (now - a.timestamp.getTime()));
      const bScore = b.importance * (1 / (now - b.timestamp.getTime()));
      return bScore - aScore;
    });
    
    return memories.slice(0, options?.limit || 20);
  }
  
  private async loadProfiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.profilesPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const data = await fs.readFile(path.join(this.profilesPath, file), 'utf-8');
          const profile = JSON.parse(data);
          
          // Convert date strings back to Date objects
          profile.metadata.createdAt = new Date(profile.metadata.createdAt);
          profile.metadata.updatedAt = new Date(profile.metadata.updatedAt);
          profile.memories = profile.memories.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          
          const validated = CharacterProfileSchema.parse(profile);
          this.profiles.set(validated.id, validated);
        } catch (error) {
          logger.error({ file, error }, 'Failed to load character profile');
        }
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to load character profiles directory');
    }
  }
  
  private async saveProfile(profile: CharacterProfile): Promise<void> {
    const filePath = path.join(this.profilesPath, `${profile.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(profile, null, 2), 'utf-8');
  }
  
  private async saveMemory(characterId: string, memory: CharacterMemory): Promise<void> {
    const memoryDir = path.join(this.memoriesPath, characterId);
    await fs.mkdir(memoryDir, { recursive: true });
    
    const filePath = path.join(memoryDir, `${memory.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(memory, null, 2), 'utf-8');
  }
  
  private pruneMemories(memories: CharacterMemory[]): CharacterMemory[] {
    // Keep all high priority memories
    const highPriority = memories.filter(m => m.retentionPriority === 'high');
    
    // Keep recent medium priority memories
    const mediumPriority = memories
      .filter(m => m.retentionPriority === 'medium')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 300);
    
    // Keep only very recent low priority memories
    const lowPriority = memories
      .filter(m => m.retentionPriority === 'low')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 100);
    
    return [...highPriority, ...mediumPriority, ...lowPriority];
  }
  
  // Character analysis methods
  
  async analyzePersonalityConsistency(characterId: string, text: string): Promise<number> {
    const profile = this.profiles.get(characterId);
    if (!profile) return 0;
    
    // This is a simplified analysis - in production, you'd use NLP
    let score = 100;
    
    // Check formality
    const formalWords = ['therefore', 'however', 'furthermore', 'nevertheless'];
    const casualWords = ['yeah', 'gonna', 'wanna', 'stuff'];
    
    const hasFormal = formalWords.some(w => text.toLowerCase().includes(w));
    const hasCasual = casualWords.some(w => text.toLowerCase().includes(w));
    
    if (profile.personality.formality > 70 && hasCasual) score -= 20;
    if (profile.personality.formality < 30 && hasFormal) score -= 20;
    
    return Math.max(0, score);
  }
}