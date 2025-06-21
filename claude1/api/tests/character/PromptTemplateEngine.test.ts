import { PromptTemplateEngine } from '../../src/services/character/PromptTemplateEngine';
import { CharacterProfile, CharacterContext } from '../../src/models/character';

describe('PromptTemplateEngine', () => {
  let engine: PromptTemplateEngine;
  let testCharacter: CharacterProfile;
  let testContext: CharacterContext;
  
  beforeEach(() => {
    engine = new PromptTemplateEngine();
    
    testCharacter = {
      id: 'sherlock',
      name: 'Sherlock Holmes',
      description: 'The world\'s greatest detective',
      personality: {
        openness: 95,
        conscientiousness: 60,
        extraversion: 30,
        agreeableness: 20,
        neuroticism: 40,
        humor: 30,
        formality: 50,
        empathy: 15,
        creativity: 90,
        analyticalThinking: 100,
        traits: ['brilliant', 'observant', 'eccentric', 'arrogant'],
        quirks: ['plays violin when thinking', 'dismissive of boring cases'],
        values: ['logic', 'truth', 'intellectual stimulation'],
      },
      background: {
        occupation: 'Consulting Detective',
        education: 'Self-taught in criminology and forensics',
        origin: 'London, England',
        age: '30s',
        interests: ['criminal psychology', 'chemistry', 'violin', 'puzzles'],
        expertise: ['deduction', 'forensics', 'disguise', 'combat'],
        experiences: ['Solved hundreds of cases', 'Defeated Moriarty'],
        culturalBackground: 'British Victorian era',
      },
      voice: {
        tone: 'authoritative',
        vocabulary: 'advanced',
        sentenceStructure: 'complex',
        pacing: 'fast',
        speechPatterns: ['deductive reasoning chains', 'dismissive remarks'],
        catchphrases: ['Elementary!', 'The game is afoot!', 'Fascinating'],
        greetings: ['What brings you to Baker Street?'],
        farewells: ['The case awaits'],
        formalityLevel: 50,
        useOfSlang: false,
        useOfTechnicalTerms: true,
      },
      knowledge: [
        {
          domain: 'Criminal Investigation',
          expertise: 'expert',
          confidence: 100,
          limitations: [],
        },
        {
          domain: 'Chemistry',
          expertise: 'advanced',
          confidence: 85,
          limitations: ['modern chemistry'],
        },
      ],
      relationships: [],
      memories: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: ['detective', 'genius'],
      },
    };
    
    testContext = {
      recentMemories: [
        {
          id: 'mem1',
          type: 'observation',
          content: 'Noticed mud on visitor\'s shoes',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          associatedEntities: ['visitor', 'mud', 'shoes'],
          emotionalValence: 0,
          importance: 70,
          retentionPriority: 'medium',
        },
      ],
      recentResponses: [
        'The evidence clearly points to the butler.',
      ],
      currentMood: {
        primary: 'focused',
        secondary: ['intrigued'],
        intensity: 80,
      },
      activeGoals: ['Solve the current case'],
      environment: {
        location: '221B Baker Street',
        timeOfDay: 'evening',
      },
      timeContext: new Date(),
    };
  });
  
  describe('generatePrompt', () => {
    it('should generate prompt for Llama models', () => {
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'What do you deduce from the evidence?',
        'llama3.1'
      );
      
      expect(prompt).toContain('<|begin_of_text|>');
      expect(prompt).toContain('<|start_header_id|>system<|end_header_id|>');
      expect(prompt).toContain('Sherlock Holmes');
      expect(prompt).toContain('world\'s greatest detective');
      expect(prompt).toContain('What do you deduce from the evidence?');
    });
    
    it('should generate prompt for ChatML format', () => {
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'Analyze this crime scene',
        'gpt-4'
      );
      
      expect(prompt).toContain('<|im_start|>system');
      expect(prompt).toContain('<|im_end|>');
      expect(prompt).toContain('Analyze this crime scene');
    });
    
    it('should generate prompt for Mistral models', () => {
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'Elementary deduction needed',
        'mistral-7b'
      );
      
      expect(prompt).toContain('[INST]');
      expect(prompt).toContain('[/INST]');
    });
    
    it('should fall back to generic template for unknown models', () => {
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'Help me solve this',
        'unknown-model-xyz'
      );
      
      expect(prompt).toContain('User:');
      expect(prompt).toContain('Assistant:');
    });
    
    it('should include personality traits in system prompt', () => {
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'Test',
        'llama3.1',
        { includePersonality: true }
      );
      
      expect(prompt).toContain('brilliant');
      expect(prompt).toContain('observant');
      expect(prompt).toContain('analytical');
    });
    
    it('should include background when requested', () => {
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'Test',
        'llama3.1',
        { includeBackground: true }
      );
      
      expect(prompt).toContain('Consulting Detective');
      expect(prompt).toContain('London');
    });
    
    it('should include recent memories in context', () => {
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'Test',
        'llama3.1',
        { includeMemories: true }
      );
      
      expect(prompt).toContain('mud on visitor\'s shoes');
      expect(prompt).toContain('Recent memories');
    });
    
    it('should include current mood when present', () => {
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'Test',
        'llama3.1',
        { includeMemories: true }
      );
      
      expect(prompt).toContain('focused');
      expect(prompt).toContain('intensity: 80');
    });
    
    it('should respect memory count limit', () => {
      // Add more memories
      testContext.recentMemories = Array(10).fill(null).map((_, i) => ({
        id: `mem${i}`,
        type: 'observation',
        content: `Observation ${i}`,
        timestamp: new Date(Date.now() - i * 3600000),
        associatedEntities: [],
        emotionalValence: 0,
        importance: 50,
        retentionPriority: 'medium' as const,
      }));
      
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'Test',
        'llama3.1',
        { includeMemories: true, memoryCount: 3 }
      );
      
      expect(prompt.match(/Observation \d+/g)?.length).toBe(3);
    });
  });
  
  describe('style variations', () => {
    it('should generate detailed personality description', () => {
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'Test',
        'llama3.1',
        { style: 'detailed' }
      );
      
      expect(prompt).toContain('Openness: 95/100');
      expect(prompt).toContain('highly creative');
    });
    
    it('should generate concise personality description', () => {
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'Test',
        'llama3.1',
        { style: 'concise' }
      );
      
      expect(prompt).toContain('Key traits:');
      expect(prompt).not.toContain('Openness: 95/100');
    });
    
    it('should generate balanced description by default', () => {
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'Test',
        'llama3.1',
        { style: 'balanced' }
      );
      
      // Should have natural language description
      expect(prompt.length).toBeGreaterThan(200);
      expect(prompt.length).toBeLessThan(2000);
    });
  });
  
  describe('template management', () => {
    it('should add custom template', () => {
      const customTemplate = {
        id: 'custom',
        name: 'Custom Model',
        modelPattern: 'custom-.*',
        template: 'CUSTOM: {system_prompt}\nUSER: {user_prompt}\nASSISTANT:',
        variables: ['system_prompt', 'user_prompt'],
        requirements: {
          minContextWindow: 2048,
          supportsSystemPrompt: true,
        },
      };
      
      engine.addTemplate(customTemplate);
      
      const templates = engine.getAllTemplates();
      expect(templates.find(t => t.id === 'custom')).toBeDefined();
    });
    
    it('should use custom template when model matches', () => {
      const customTemplate = {
        id: 'custom',
        name: 'Custom Model',
        modelPattern: 'mymodel',
        template: 'CUSTOM_PROMPT: {system_prompt}\n{user_prompt}',
        variables: ['system_prompt', 'user_prompt'],
        requirements: {
          minContextWindow: 2048,
          supportsSystemPrompt: true,
        },
      };
      
      engine.addTemplate(customTemplate);
      
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        'Test prompt',
        'mymodel'
      );
      
      expect(prompt).toContain('CUSTOM_PROMPT:');
    });
    
    it('should get template by ID', () => {
      const template = engine.getTemplate('llama');
      
      expect(template).toBeDefined();
      expect(template?.name).toBe('Llama Models');
    });
    
    it('should list all templates', () => {
      const templates = engine.getAllTemplates();
      
      expect(templates.length).toBeGreaterThan(3);
      expect(templates.map(t => t.id)).toContain('llama');
      expect(templates.map(t => t.id)).toContain('chatml');
      expect(templates.map(t => t.id)).toContain('mistral');
      expect(templates.map(t => t.id)).toContain('generic');
    });
  });
  
  describe('edge cases', () => {
    it('should handle missing optional context', () => {
      const minimalContext: CharacterContext = {
        recentMemories: [],
        recentResponses: [],
        activeGoals: [],
        environment: {},
        timeContext: new Date(),
      };
      
      const prompt = engine.generatePrompt(
        testCharacter,
        minimalContext,
        'Test',
        'llama3.1'
      );
      
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(100);
    });
    
    it('should handle character with minimal data', () => {
      const minimalCharacter: CharacterProfile = {
        ...testCharacter,
        background: {
          interests: [],
          expertise: [],
          experiences: [],
        },
        voice: {
          ...testCharacter.voice,
          catchphrases: [],
          greetings: [],
          farewells: [],
          speechPatterns: [],
        },
        knowledge: [],
      };
      
      const prompt = engine.generatePrompt(
        minimalCharacter,
        testContext,
        'Test',
        'llama3.1'
      );
      
      expect(prompt).toBeDefined();
      expect(prompt).toContain('Sherlock Holmes');
    });
    
    it('should handle very long user prompts', () => {
      const longPrompt = 'A'.repeat(10000);
      
      const prompt = engine.generatePrompt(
        testCharacter,
        testContext,
        longPrompt,
        'llama3.1'
      );
      
      expect(prompt).toContain(longPrompt);
    });
  });
});