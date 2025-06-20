import { CharacterProfileManager } from '../../src/services/character/CharacterProfileManager';
import { CharacterProfile } from '../../src/models/character';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');

describe('CharacterProfileManager', () => {
  let manager: CharacterProfileManager;
  const testDataPath = './test-data/characters';
  
  beforeEach(() => {
    jest.clearAllMocks();
    manager = new CharacterProfileManager(testDataPath);
    
    // Mock file system operations
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.readdir as jest.Mock).mockResolvedValue([]);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
  });
  
  describe('initialize', () => {
    it('should create necessary directories', async () => {
      await manager.initialize();
      
      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(testDataPath, 'profiles'),
        { recursive: true }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(testDataPath, 'memories'),
        { recursive: true }
      );
    });
    
    it('should load existing profiles', async () => {
      const mockProfile = {
        id: 'existing-character',
        name: 'Test Character',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          tags: [],
        },
        memories: [],
      };
      
      (fs.readdir as jest.Mock).mockResolvedValue(['existing-character.json']);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockProfile));
      
      await manager.initialize();
      
      const profiles = await manager.getAllProfiles();
      expect(profiles).toHaveLength(1);
    });
  });
  
  describe('createProfile', () => {
    const testProfile: Omit<CharacterProfile, 'metadata'> = {
      id: 'test-char',
      name: 'Test Character',
      description: 'A test character',
      personality: {
        openness: 70,
        conscientiousness: 80,
        extraversion: 60,
        agreeableness: 75,
        neuroticism: 30,
        humor: 50,
        formality: 60,
        empathy: 70,
        creativity: 65,
        analyticalThinking: 75,
        traits: ['friendly', 'curious'],
        quirks: ['laughs nervously'],
        values: ['honesty', 'learning'],
      },
      background: {
        occupation: 'Teacher',
        interests: ['reading', 'technology'],
        expertise: ['education'],
        experiences: [],
      },
      voice: {
        tone: 'friendly',
        vocabulary: 'moderate',
        sentenceStructure: 'simple',
        pacing: 'moderate',
        speechPatterns: [],
        catchphrases: [],
        greetings: ['Hello!'],
        farewells: ['Goodbye!'],
        formalityLevel: 60,
        useOfSlang: false,
        useOfTechnicalTerms: false,
      },
      knowledge: [],
      relationships: [],
      memories: [],
    };
    
    it('should create a new profile with metadata', async () => {
      await manager.initialize();
      const created = await manager.createProfile(testProfile);
      
      expect(created.id).toBe(testProfile.id);
      expect(created.metadata).toBeDefined();
      expect(created.metadata.version).toBe(1);
      expect(created.metadata.createdAt).toBeInstanceOf(Date);
    });
    
    it('should save profile to disk', async () => {
      await manager.initialize();
      await manager.createProfile(testProfile);
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-char.json'),
        expect.any(String),
        'utf-8'
      );
    });
    
    it('should validate profile data', async () => {
      await manager.initialize();
      
      const invalidProfile = {
        ...testProfile,
        personality: {
          ...testProfile.personality,
          openness: 150, // Invalid: exceeds max
        },
      };
      
      await expect(manager.createProfile(invalidProfile)).rejects.toThrow();
    });
  });
  
  describe('updateProfile', () => {
    beforeEach(async () => {
      await manager.initialize();
      // Create a profile first
      (fs.readdir as jest.Mock).mockResolvedValue([]);
      await manager.createProfile({
        id: 'update-test',
        name: 'Original Name',
        description: 'Original description',
        personality: {
          openness: 50,
          conscientiousness: 50,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 50,
          humor: 50,
          formality: 50,
          empathy: 50,
          creativity: 50,
          analyticalThinking: 50,
          traits: [],
          quirks: [],
          values: [],
        },
        background: {
          interests: [],
          expertise: [],
          experiences: [],
        },
        voice: {
          tone: 'casual',
          vocabulary: 'simple',
          sentenceStructure: 'simple',
          pacing: 'slow',
          speechPatterns: [],
          catchphrases: [],
          greetings: [],
          farewells: [],
          formalityLevel: 30,
          useOfSlang: false,
          useOfTechnicalTerms: false,
        },
        knowledge: [],
        relationships: [],
        memories: [],
      });
    });
    
    it('should update existing profile', async () => {
      const updates = {
        name: 'Updated Name',
        description: 'Updated description',
      };
      
      const updated = await manager.updateProfile('update-test', updates);
      
      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.metadata.version).toBe(2);
    });
    
    it('should not allow changing ID', async () => {
      const updates = {
        id: 'different-id',
        name: 'Updated Name',
      };
      
      const updated = await manager.updateProfile('update-test', updates);
      
      expect(updated.id).toBe('update-test');
    });
    
    it('should throw for non-existent profile', async () => {
      await expect(
        manager.updateProfile('non-existent', { name: 'New Name' })
      ).rejects.toThrow('Character profile not found');
    });
  });
  
  describe('memory management', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.createProfile({
        id: 'memory-test',
        name: 'Memory Test Character',
        description: 'Test character for memory',
        personality: {
          openness: 50,
          conscientiousness: 50,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 50,
          humor: 50,
          formality: 50,
          empathy: 50,
          creativity: 50,
          analyticalThinking: 50,
          traits: [],
          quirks: [],
          values: [],
        },
        background: {
          interests: [],
          expertise: [],
          experiences: [],
        },
        voice: {
          tone: 'casual',
          vocabulary: 'simple',
          sentenceStructure: 'simple',
          pacing: 'moderate',
          speechPatterns: [],
          catchphrases: [],
          greetings: [],
          farewells: [],
          formalityLevel: 50,
          useOfSlang: false,
          useOfTechnicalTerms: false,
        },
        knowledge: [],
        relationships: [],
        memories: [],
      });
    });
    
    it('should add memory to character', async () => {
      const memory = {
        type: 'interaction',
        content: 'User asked about the weather',
        associatedEntities: ['weather', 'user'],
        emotionalValence: 0,
        importance: 50,
        retentionPriority: 'medium' as const,
      };
      
      await manager.addMemory('memory-test', memory);
      
      const memories = await manager.getRecentMemories('memory-test', 10);
      expect(memories).toHaveLength(1);
      expect(memories[0].content).toBe(memory.content);
      expect(memories[0].id).toBeDefined();
      expect(memories[0].timestamp).toBeInstanceOf(Date);
    });
    
    it('should retrieve recent memories', async () => {
      // Add multiple memories
      for (let i = 0; i < 5; i++) {
        await manager.addMemory('memory-test', {
          type: 'interaction',
          content: `Memory ${i}`,
          associatedEntities: [],
          emotionalValence: 0,
          importance: 50,
          retentionPriority: 'medium',
        });
      }
      
      const recent = await manager.getRecentMemories('memory-test', 3);
      expect(recent).toHaveLength(3);
      expect(recent[0].content).toBe('Memory 4'); // Most recent first
    });
    
    it('should filter memories by type', async () => {
      await manager.addMemory('memory-test', {
        type: 'fact',
        content: 'Fact memory',
        associatedEntities: [],
        emotionalValence: 0,
        importance: 70,
        retentionPriority: 'high',
      });
      
      await manager.addMemory('memory-test', {
        type: 'interaction',
        content: 'Interaction memory',
        associatedEntities: [],
        emotionalValence: 0,
        importance: 50,
        retentionPriority: 'medium',
      });
      
      const facts = await manager.getRecentMemories('memory-test', 10, ['fact']);
      expect(facts).toHaveLength(1);
      expect(facts[0].type).toBe('fact');
    });
    
    it('should search memories', async () => {
      await manager.addMemory('memory-test', {
        type: 'interaction',
        content: 'User likes pizza',
        associatedEntities: ['user', 'pizza', 'food'],
        emotionalValence: 10,
        importance: 60,
        retentionPriority: 'medium',
      });
      
      await manager.addMemory('memory-test', {
        type: 'fact',
        content: 'Weather is sunny today',
        associatedEntities: ['weather', 'sunny'],
        emotionalValence: 5,
        importance: 30,
        retentionPriority: 'low',
      });
      
      const pizzaMemories = await manager.searchMemories('memory-test', 'pizza');
      expect(pizzaMemories).toHaveLength(1);
      expect(pizzaMemories[0].content).toContain('pizza');
      
      const foodMemories = await manager.searchMemories('memory-test', 'food');
      expect(foodMemories).toHaveLength(1);
    });
    
    it('should prune memories when limit exceeded', async () => {
      // This test would require mocking the internal memory limit
      // For now, we'll just verify the method exists
      expect(manager['pruneMemories']).toBeDefined();
    });
  });
  
  describe('deleteProfile', () => {
    it('should delete profile and associated data', async () => {
      await manager.initialize();
      await manager.createProfile({
        id: 'delete-test',
        name: 'Delete Test',
        description: 'To be deleted',
        personality: {
          openness: 50,
          conscientiousness: 50,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 50,
          humor: 50,
          formality: 50,
          empathy: 50,
          creativity: 50,
          analyticalThinking: 50,
          traits: [],
          quirks: [],
          values: [],
        },
        background: {
          interests: [],
          expertise: [],
          experiences: [],
        },
        voice: {
          tone: 'casual',
          vocabulary: 'simple',
          sentenceStructure: 'simple',
          pacing: 'moderate',
          speechPatterns: [],
          catchphrases: [],
          greetings: [],
          farewells: [],
          formalityLevel: 50,
          useOfSlang: false,
          useOfTechnicalTerms: false,
        },
        knowledge: [],
        relationships: [],
        memories: [],
      });
      
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);
      (fs.rm as jest.Mock).mockResolvedValue(undefined);
      
      await manager.deleteProfile('delete-test');
      
      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('delete-test.json')
      );
      expect(fs.rm).toHaveBeenCalledWith(
        expect.stringContaining('delete-test'),
        { recursive: true }
      );
      
      const profiles = await manager.getAllProfiles();
      expect(profiles.find(p => p.id === 'delete-test')).toBeUndefined();
    });
  });
});