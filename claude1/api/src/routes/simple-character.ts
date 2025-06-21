import { FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

interface SimpleCharacter {
  id: string;
  name: string;
  avatar?: string;
  personality: {
    traits: string[];
    humor: number;
    formality: number;
    enthusiasm: number;
    empathy: number;
    quirks?: string[];
  };
  voice: {
    tone: string;
    vocabulary: string;
    sentenceStructure: string;
    speechPatterns?: string[];
    languageStyle?: string;
  };
  catchphrases?: string[];
  background?: string;
  relationships?: {
    characterId: string;
    type: 'friend' | 'rival' | 'mentor' | 'student' | 'family' | 'colleague';
    description: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// In-memory storage for development
const characters: Map<string, SimpleCharacter> = new Map();

const simpleCharacterRoutes: FastifyPluginAsync = async (fastify) => {
  // Create character
  fastify.post<{
    Body: Omit<SimpleCharacter, 'id' | 'createdAt' | 'updatedAt'>;
  }>('/characters', {
    schema: {
      description: 'Create a simple character',
      tags: ['simple-characters'],
      body: {
        type: 'object',
        required: ['name', 'personality', 'voice'],
        properties: {
          name: { type: 'string' },
          avatar: { type: 'string' },
          personality: {
            type: 'object',
            required: ['traits', 'humor', 'formality', 'enthusiasm', 'empathy'],
            properties: {
              traits: { type: 'array', items: { type: 'string' } },
              humor: { type: 'number', minimum: 0, maximum: 100 },
              formality: { type: 'number', minimum: 0, maximum: 100 },
              enthusiasm: { type: 'number', minimum: 0, maximum: 100 },
              empathy: { type: 'number', minimum: 0, maximum: 100 },
              quirks: { type: 'array', items: { type: 'string' } },
            },
          },
          voice: {
            type: 'object',
            required: ['tone', 'vocabulary', 'sentenceStructure'],
            properties: {
              tone: { type: 'string' },
              vocabulary: { type: 'string' },
              sentenceStructure: { type: 'string' },
              speechPatterns: { type: 'array', items: { type: 'string' } },
              languageStyle: { type: 'string' },
            },
          },
          catchphrases: { type: 'array', items: { type: 'string' } },
          background: { type: 'string' },
          relationships: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                characterId: { type: 'string' },
                type: { enum: ['friend', 'rival', 'mentor', 'student', 'family', 'colleague'] },
                description: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const character: SimpleCharacter = {
        id: uuidv4(),
        ...request.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      characters.set(character.id, character);
      
      // Log for debugging
      fastify.log.info({ characterId: character.id }, 'Character created');
      
      return reply.code(201).send({ data: character });
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({ error: 'Failed to create character' });
    }
  });

  // Get all characters
  fastify.get('/characters', async (request, reply) => {
    try {
      const allCharacters = Array.from(characters.values());
      return { data: allCharacters };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to get characters' });
    }
  });

  // Get character by ID
  fastify.get<{
    Params: { id: string };
  }>('/characters/:id', async (request, reply) => {
    try {
      const character = characters.get(request.params.id);
      if (!character) {
        return reply.code(404).send({ error: 'Character not found' });
      }
      return { data: character };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to get character' });
    }
  });

  // Update character
  fastify.put<{
    Params: { id: string };
    Body: Partial<Omit<SimpleCharacter, 'id' | 'createdAt' | 'updatedAt'>>;
  }>('/characters/:id', async (request, reply) => {
    try {
      const character = characters.get(request.params.id);
      if (!character) {
        return reply.code(404).send({ error: 'Character not found' });
      }
      
      const updated = {
        ...character,
        ...request.body,
        updatedAt: new Date().toISOString(),
      };
      
      characters.set(request.params.id, updated);
      return { data: updated };
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({ error: 'Failed to update character' });
    }
  });

  // Delete character
  fastify.delete<{
    Params: { id: string };
  }>('/characters/:id', async (request, reply) => {
    try {
      if (!characters.has(request.params.id)) {
        return reply.code(404).send({ error: 'Character not found' });
      }
      
      characters.delete(request.params.id);
      reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({ error: 'Failed to delete character' });
    }
  });

  // Duplicate character
  fastify.post<{
    Params: { id: string };
  }>('/characters/:id/duplicate', async (request, reply) => {
    try {
      const original = characters.get(request.params.id);
      if (!original) {
        return reply.code(404).send({ error: 'Character not found' });
      }
      
      const duplicate: SimpleCharacter = {
        ...original,
        id: uuidv4(),
        name: `${original.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      characters.set(duplicate.id, duplicate);
      return reply.code(201).send({ data: duplicate });
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({ error: 'Failed to duplicate character' });
    }
  });
};

export default simpleCharacterRoutes;