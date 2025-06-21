import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Message, GenerationTask } from '../models/types';

const ChatRequestSchema = z.object({
  message: z.string().min(1),
  context: z.object({
    sessionId: z.string().optional(),
    characterId: z.string().optional(),
    conversationHistory: z.array(z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string()
    })).optional()
  }).optional(),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(4096).optional(),
    systemPrompt: z.string().optional()
  }).optional()
});

export const chatRoutes: FastifyPluginAsync = async (server) => {
  server.post('/', {
    schema: {
      body: {
        type: 'object',
        properties: {
          message: { type: 'string', minLength: 1 },
          context: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              characterId: { type: 'string' },
              conversationHistory: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    role: { enum: ['system', 'user', 'assistant'] },
                    content: { type: 'string' }
                  },
                  required: ['role', 'content']
                }
              }
            }
          },
          options: {
            type: 'object',
            properties: {
              temperature: { type: 'number', minimum: 0, maximum: 2 },
              maxTokens: { type: 'number', minimum: 1, maximum: 4096 },
              systemPrompt: { type: 'string' }
            }
          }
        },
        required: ['message']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            response: { type: 'string' },
            model: { type: 'string' },
            provider: { type: 'string' },
            usage: {
              type: 'object',
              properties: {
                promptTokens: { type: 'number' },
                completionTokens: { type: 'number' },
                totalTokens: { type: 'number' }
              }
            },
            context: {
              type: 'object',
              properties: {
                sessionId: { type: 'string' },
                characterId: { type: 'string' }
              }
            }
          },
          required: ['response', 'model', 'provider']
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          },
          required: ['error']
        }
      }
    }
  }, async (request, reply) => {
    const { message, context, options = {} } = request.body as z.infer<typeof ChatRequestSchema>;
    
    const conversationHistory: Message[] = context?.conversationHistory || [];
    conversationHistory.push({ role: 'user', content: message });
    
    const task: GenerationTask = {
      prompt: message,
      options: {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1024,
        systemPrompt: options.systemPrompt
      },
      context: {
        sessionId: context?.sessionId,
        characterId: context?.characterId,
        conversationHistory
      }
    };
    
    try {
      const result = await server.orchestrator.executeWithFallback(task);
      
      return {
        response: result.text,
        model: result.model,
        provider: result.provider,
        usage: result.usage,
        context: {
          sessionId: context?.sessionId,
          characterId: context?.characterId
        }
      };
    } catch (error) {
      request.log.error({ error }, 'Chat failed');
      reply.code(500);
      return { 
        error: 'Chat failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });
};