import { FastifyPluginAsync } from 'fastify';
import { MemeGenerator } from '../services/meme/MemeGenerator';
import path from 'path';
import fs from 'fs/promises';

export const memeRoutes: FastifyPluginAsync = async (fastify) => {
  const memeGenerator = new MemeGenerator(path.join(process.cwd(), 'generated-memes'));

  // Generate meme endpoint
  fastify.post<{
    Body: {
      prompt: string;
      characterId: string;
      template?: string;
      options?: any;
      context?: any;
    };
  }>('/generate/meme', {
    schema: {
      description: 'Generate a meme with character',
      tags: ['generation', 'memes'],
      body: {
        type: 'object',
        required: ['prompt', 'characterId'],
        properties: {
          prompt: { type: 'string' },
          characterId: { type: 'string' },
          template: { type: 'string' },
          options: { type: 'object' },
          context: { type: 'object' },
        },
      },
      response: {
        200: {
          description: 'Generated meme with image',
          type: 'object',
          properties: {
            content: { type: 'string' },
            imageUrl: { type: 'string' },
            imagePath: { type: 'string' },
            characterId: { type: 'string' },
            consistency: { type: 'object' },
            metadata: { type: 'object' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const orchestrator = (fastify as any).orchestrator;
      
      // First generate the text content using the character
      const result = await orchestrator.generateCharacterResponse({
        prompt: request.body.prompt,
        characterId: request.body.characterId,
        options: request.body.options,
        characterOptions: {
          context: request.body.context,
          enforceConsistency: request.body.options?.enforceConsistency,
        },
      });

      // Generate the meme image
      const imagePath = await memeGenerator.generateFromLLMResponse(
        result.content,
        request.body.template || 'default'
      );

      // Read the image and convert to base64 for easy display
      const imageBuffer = await fs.readFile(imagePath);
      const imageBase64 = imageBuffer.toString('base64');
      const imageUrl = `data:image/png;base64,${imageBase64}`;

      return {
        content: result.content,
        imageUrl,
        imagePath,
        ...result.characterResponse,
        providerId: result.providerId,
        modelId: result.modelId,
        usage: result.usage,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to generate meme' });
    }
  });

  // Serve generated meme images
  fastify.get<{
    Params: { filename: string };
  }>('/memes/:filename', async (request, reply) => {
    try {
      const filepath = path.join(process.cwd(), 'generated-memes', request.params.filename);
      const image = await fs.readFile(filepath);
      reply.type('image/png').send(image);
    } catch (error) {
      reply.code(404).send({ error: 'Meme not found' });
    }
  });
};

export default memeRoutes;