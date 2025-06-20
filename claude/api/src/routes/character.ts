import { FastifyPluginAsync } from 'fastify';
import { CharacterAwareOrchestrator } from '../services/hybrid/CharacterAwareOrchestrator';
import { 
  CharacterProfile, 
  PersonalityTraits, 
  CharacterBackground,
  VoiceStyle,
  KnowledgeDomain,
  CharacterMemory 
} from '../models/character';

const characterRoutes: FastifyPluginAsync = async (fastify) => {
  const orchestrator = fastify.orchestrator as CharacterAwareOrchestrator;
  
  // Create character profile
  fastify.post<{
    Body: Omit<CharacterProfile, 'metadata'>;
  }>('/characters', {
    schema: {
      description: 'Create a new character profile',
      tags: ['characters'],
      body: {
        type: 'object',
        required: ['id', 'name', 'description', 'personality', 'background', 'voice', 'knowledge'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          personality: {
            type: 'object',
            required: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'],
            properties: {
              openness: { type: 'number', minimum: 0, maximum: 100 },
              conscientiousness: { type: 'number', minimum: 0, maximum: 100 },
              extraversion: { type: 'number', minimum: 0, maximum: 100 },
              agreeableness: { type: 'number', minimum: 0, maximum: 100 },
              neuroticism: { type: 'number', minimum: 0, maximum: 100 },
              humor: { type: 'number', minimum: 0, maximum: 100 },
              formality: { type: 'number', minimum: 0, maximum: 100 },
              empathy: { type: 'number', minimum: 0, maximum: 100 },
              creativity: { type: 'number', minimum: 0, maximum: 100 },
              analyticalThinking: { type: 'number', minimum: 0, maximum: 100 },
              traits: { type: 'array', items: { type: 'string' } },
              quirks: { type: 'array', items: { type: 'string' } },
              values: { type: 'array', items: { type: 'string' } },
            },
          },
          background: {
            type: 'object',
            properties: {
              occupation: { type: 'string' },
              education: { type: 'string' },
              origin: { type: 'string' },
              age: { oneOf: [{ type: 'number' }, { type: 'string' }] },
              interests: { type: 'array', items: { type: 'string' } },
              expertise: { type: 'array', items: { type: 'string' } },
              experiences: { type: 'array', items: { type: 'string' } },
              culturalBackground: { type: 'string' },
            },
          },
          voice: {
            type: 'object',
            required: ['tone', 'vocabulary', 'sentenceStructure', 'pacing'],
            properties: {
              tone: { enum: ['professional', 'casual', 'friendly', 'authoritative', 'playful', 'empathetic'] },
              vocabulary: { enum: ['simple', 'moderate', 'advanced', 'technical', 'mixed'] },
              sentenceStructure: { enum: ['simple', 'complex', 'varied'] },
              pacing: { enum: ['slow', 'moderate', 'fast', 'dynamic'] },
              speechPatterns: { type: 'array', items: { type: 'string' } },
              catchphrases: { type: 'array', items: { type: 'string' } },
              greetings: { type: 'array', items: { type: 'string' } },
              farewells: { type: 'array', items: { type: 'string' } },
              formalityLevel: { type: 'number', minimum: 0, maximum: 100 },
              useOfSlang: { type: 'boolean' },
              useOfTechnicalTerms: { type: 'boolean' },
              preferredPronouns: { type: 'string' },
            },
          },
          knowledge: {
            type: 'array',
            items: {
              type: 'object',
              required: ['domain', 'expertise', 'confidence'],
              properties: {
                domain: { type: 'string' },
                expertise: { enum: ['basic', 'intermediate', 'advanced', 'expert'] },
                confidence: { type: 'number', minimum: 0, maximum: 100 },
                limitations: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          relationships: { type: 'array', items: { type: 'object' } },
          memories: { type: 'array', items: { type: 'object' } },
        },
      },
      response: {
        200: {
          description: 'Character profile created successfully',
          type: 'object',
        },
      },
    },
  }, async (request, reply) => {
    try {
      const profile = await orchestrator.createCharacter(request.body);
      return profile;
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({ error: 'Failed to create character profile' });
    }
  });
  
  // Get all characters
  fastify.get('/characters', {
    schema: {
      description: 'Get all character profiles',
      tags: ['characters'],
      response: {
        200: {
          description: 'List of character profiles',
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const profiles = await orchestrator.getAllCharacters();
      return profiles;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to retrieve character profiles' });
    }
  });
  
  // Get character by ID
  fastify.get<{
    Params: { characterId: string };
  }>('/characters/:characterId', {
    schema: {
      description: 'Get a character profile by ID',
      tags: ['characters'],
      params: {
        type: 'object',
        properties: {
          characterId: { type: 'string' },
        },
        required: ['characterId'],
      },
      response: {
        200: {
          description: 'Character profile',
          type: 'object',
        },
        404: {
          description: 'Character not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const profile = await orchestrator.getCharacter(request.params.characterId);
      if (!profile) {
        reply.code(404).send({ error: 'Character not found' });
        return;
      }
      return profile;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to retrieve character profile' });
    }
  });
  
  // Update character
  fastify.patch<{
    Params: { characterId: string };
    Body: Partial<CharacterProfile>;
  }>('/characters/:characterId', {
    schema: {
      description: 'Update a character profile',
      tags: ['characters'],
      params: {
        type: 'object',
        properties: {
          characterId: { type: 'string' },
        },
        required: ['characterId'],
      },
      body: {
        type: 'object',
        // Allow any properties from CharacterProfile
      },
      response: {
        200: {
          description: 'Updated character profile',
          type: 'object',
        },
      },
    },
  }, async (request, reply) => {
    try {
      const profile = await orchestrator.updateCharacter(
        request.params.characterId,
        request.body
      );
      return profile;
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({ error: 'Failed to update character profile' });
    }
  });
  
  // Delete character
  fastify.delete<{
    Params: { characterId: string };
  }>('/characters/:characterId', {
    schema: {
      description: 'Delete a character profile',
      tags: ['characters'],
      params: {
        type: 'object',
        properties: {
          characterId: { type: 'string' },
        },
        required: ['characterId'],
      },
      response: {
        204: {
          description: 'Character deleted successfully',
        },
      },
    },
  }, async (request, reply) => {
    try {
      await orchestrator.deleteCharacter(request.params.characterId);
      reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({ error: 'Failed to delete character profile' });
    }
  });
  
  // Add memory to character
  fastify.post<{
    Params: { characterId: string };
    Body: Omit<CharacterMemory, 'id' | 'timestamp'>;
  }>('/characters/:characterId/memories', {
    schema: {
      description: 'Add a memory to a character',
      tags: ['characters'],
      params: {
        type: 'object',
        properties: {
          characterId: { type: 'string' },
        },
        required: ['characterId'],
      },
      body: {
        type: 'object',
        required: ['type', 'content', 'importance'],
        properties: {
          type: { type: 'string' },
          content: { type: 'string' },
          associatedEntities: { type: 'array', items: { type: 'string' } },
          emotionalValence: { type: 'number', minimum: -100, maximum: 100 },
          importance: { type: 'number', minimum: 0, maximum: 100 },
          retentionPriority: { enum: ['low', 'medium', 'high'] },
        },
      },
      response: {
        201: {
          description: 'Memory added successfully',
        },
      },
    },
  }, async (request, reply) => {
    try {
      await orchestrator.addCharacterMemory(request.params.characterId, request.body);
      reply.code(201).send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({ error: 'Failed to add memory' });
    }
  });
  
  // Get character memories
  fastify.get<{
    Params: { characterId: string };
    Querystring: {
      count?: number;
      types?: string[];
    };
  }>('/characters/:characterId/memories', {
    schema: {
      description: 'Get recent memories for a character',
      tags: ['characters'],
      params: {
        type: 'object',
        properties: {
          characterId: { type: 'string' },
        },
        required: ['characterId'],
      },
      querystring: {
        type: 'object',
        properties: {
          count: { type: 'number', minimum: 1, maximum: 100 },
          types: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        200: {
          description: 'List of memories',
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const memories = await orchestrator.getCharacterMemories(
        request.params.characterId,
        request.query.count,
        request.query.types
      );
      return memories;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to retrieve memories' });
    }
  });
  
  // Search character memories
  fastify.get<{
    Params: { characterId: string };
    Querystring: {
      q: string;
      types?: string[];
      minImportance?: number;
      limit?: number;
    };
  }>('/characters/:characterId/memories/search', {
    schema: {
      description: 'Search memories for a character',
      tags: ['characters'],
      params: {
        type: 'object',
        properties: {
          characterId: { type: 'string' },
        },
        required: ['characterId'],
      },
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 1 },
          types: { type: 'array', items: { type: 'string' } },
          minImportance: { type: 'number', minimum: 0, maximum: 100 },
          limit: { type: 'number', minimum: 1, maximum: 100 },
        },
      },
      response: {
        200: {
          description: 'Search results',
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const memories = await orchestrator.searchCharacterMemories(
        request.params.characterId,
        request.query.q,
        {
          types: request.query.types,
          minImportance: request.query.minImportance,
          limit: request.query.limit,
        }
      );
      return memories;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to search memories' });
    }
  });
  
  // Generate with character
  fastify.post<{
    Body: {
      prompt: string;
      characterId: string;
      options?: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        enforceConsistency?: boolean;
        includeMemories?: boolean;
        memoryCount?: number;
      };
      context?: {
        currentMood?: {
          primary: string;
          secondary?: string[];
          intensity: number;
        };
        activeGoals?: string[];
        environment?: Record<string, any>;
      };
    };
  }>('/generate/character', {
    schema: {
      description: 'Generate content using a character profile',
      tags: ['generation', 'characters'],
      body: {
        type: 'object',
        required: ['prompt', 'characterId'],
        properties: {
          prompt: { type: 'string' },
          characterId: { type: 'string' },
          options: {
            type: 'object',
            properties: {
              temperature: { type: 'number', minimum: 0, maximum: 2 },
              maxTokens: { type: 'number', minimum: 1 },
              topP: { type: 'number', minimum: 0, maximum: 1 },
              enforceConsistency: { type: 'boolean' },
              includeMemories: { type: 'boolean' },
              memoryCount: { type: 'number', minimum: 1, maximum: 20 },
            },
          },
          context: {
            type: 'object',
            properties: {
              currentMood: {
                type: 'object',
                properties: {
                  primary: { type: 'string' },
                  secondary: { type: 'array', items: { type: 'string' } },
                  intensity: { type: 'number', minimum: 0, maximum: 100 },
                },
              },
              activeGoals: { type: 'array', items: { type: 'string' } },
              environment: { type: 'object' },
            },
          },
        },
      },
      response: {
        200: {
          description: 'Generated content with character consistency',
          type: 'object',
          properties: {
            content: { type: 'string' },
            characterId: { type: 'string' },
            consistency: {
              type: 'object',
              properties: {
                overall: { type: 'number' },
                personality: { type: 'number' },
                voice: { type: 'number' },
                knowledge: { type: 'number' },
                emotional: { type: 'number' },
                details: { type: 'array', items: { type: 'string' } },
              },
            },
            metadata: {
              type: 'object',
              properties: {
                generationTime: { type: 'number' },
                modelUsed: { type: 'string' },
                retriedForConsistency: { type: 'boolean' },
                originalScore: { type: 'number' },
              },
            },
            providerId: { type: 'string' },
            modelId: { type: 'string' },
            usage: {
              type: 'object',
              properties: {
                promptTokens: { type: 'number' },
                completionTokens: { type: 'number' },
                totalTokens: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const result = await orchestrator.generate({
        id: `gen_${Date.now()}`,
        prompt: request.body.prompt,
        characterId: request.body.characterId,
        options: request.body.options,
        characterOptions: {
          context: request.body.context,
          enforceConsistency: request.body.options?.enforceConsistency,
          includeMemories: request.body.options?.includeMemories,
          memoryCount: request.body.options?.memoryCount,
        },
      });
      
      return {
        content: result.content,
        ...result.characterResponse,
        providerId: result.providerId,
        modelId: result.modelId,
        usage: result.usage,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to generate character response' });
    }
  });
};

export default characterRoutes;