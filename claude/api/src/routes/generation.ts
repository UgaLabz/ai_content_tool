import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { GenerationTask } from '../models/types';

const GenerationRequestSchema = z.object({
  prompt: z.string().min(1),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(4096).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().min(1).optional(),
    systemPrompt: z.string().optional(),
    stopSequences: z.array(z.string()).optional()
  }).optional(),
  requirements: z.object({
    privacy: z.boolean().optional(),
    preferredProvider: z.string().optional(),
    maxLatency: z.number().optional(),
    complexity: z.number().min(1).max(10).optional()
  }).optional()
});

export const generationRoutes: FastifyPluginAsync = async (server) => {
  server.post('/text', {
    schema: {
      body: {
        type: 'object',
        properties: {
          prompt: { type: 'string', minLength: 1 },
          options: {
            type: 'object',
            properties: {
              temperature: { type: 'number', minimum: 0, maximum: 2 },
              maxTokens: { type: 'number', minimum: 1, maximum: 4096 },
              topP: { type: 'number', minimum: 0, maximum: 1 },
              topK: { type: 'number', minimum: 1 },
              systemPrompt: { type: 'string' },
              stopSequences: { type: 'array', items: { type: 'string' } }
            }
          },
          requirements: {
            type: 'object',
            properties: {
              privacy: { type: 'boolean' },
              preferredProvider: { type: 'string' },
              maxLatency: { type: 'number' },
              complexity: { type: 'number', minimum: 1, maximum: 10 }
            }
          }
        },
        required: ['prompt']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            model: { type: 'string' },
            provider: { type: 'string' },
            latency: { type: 'number' },
            usage: {
              type: 'object',
              properties: {
                promptTokens: { type: 'number' },
                completionTokens: { type: 'number' },
                totalTokens: { type: 'number' }
              }
            }
          },
          required: ['text', 'model', 'provider']
        }
      }
    }
  }, async (request, reply) => {
    const { prompt, options = {}, requirements = {} } = request.body as z.infer<typeof GenerationRequestSchema>;
    
    const task: GenerationTask = {
      prompt,
      options: {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1024,
        topP: options.topP || 0.9,
        topK: options.topK,
        systemPrompt: options.systemPrompt,
        stopSequences: options.stopSequences || []
      },
      requirements
    };
    
    try {
      const result = await server.orchestrator.executeWithFallback(task);
      return result;
    } catch (error) {
      request.log.error({ error }, 'Generation failed');
      reply.code(500);
      return { 
        error: 'Generation failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });
  
  server.post('/stream', {
    schema: {
      body: {
        type: 'object',
        properties: {
          prompt: { type: 'string', minLength: 1 },
          options: {
            type: 'object',
            properties: {
              temperature: { type: 'number', minimum: 0, maximum: 2 },
              maxTokens: { type: 'number', minimum: 1, maximum: 4096 },
              topP: { type: 'number', minimum: 0, maximum: 1 },
              topK: { type: 'number', minimum: 1 },
              systemPrompt: { type: 'string' },
              stopSequences: { type: 'array', items: { type: 'string' } }
            }
          },
          requirements: {
            type: 'object',
            properties: {
              privacy: { type: 'boolean' },
              preferredProvider: { type: 'string' },
              maxLatency: { type: 'number' },
              complexity: { type: 'number', minimum: 1, maximum: 10 }
            }
          }
        },
        required: ['prompt']
      }
    }
  }, async (request, reply) => {
    const { prompt, options = {}, requirements = {} } = request.body as z.infer<typeof GenerationRequestSchema>;
    
    reply.type('text/event-stream');
    reply.header('Cache-Control', 'no-cache');
    reply.header('Connection', 'keep-alive');
    
    try {
      const provider = await server.orchestrator.selectProvider({
        prompt,
        options: { ...options, stream: true },
        requirements
      });
      
      const stream = provider.generateStream(prompt, options);
      
      for await (const chunk of stream) {
        reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      
      reply.raw.write('data: [DONE]\n\n');
      reply.raw.end();
    } catch (error) {
      request.log.error({ error }, 'Streaming failed');
      reply.raw.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
      reply.raw.end();
    }
  });
};