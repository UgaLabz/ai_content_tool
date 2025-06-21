import { FastifyPluginAsync } from 'fastify';
import { ImageGenerationService } from '../services/image/ImageGenerationService';
import path from 'path';
import fs from 'fs/promises';

export const memeAIRoutes: FastifyPluginAsync = async (fastify) => {
  const imageGenService = new ImageGenerationService(
    path.join(process.cwd(), 'generated-images')
  );

  // Generate AI meme endpoint
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
      description: 'Generate an AI meme with character',
      tags: ['generation', 'memes', 'ai'],
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
          description: 'Generated AI meme with image',
          type: 'object',
          properties: {
            content: { type: 'string' },
            imageUrl: { type: 'string' },
            imagePath: { type: 'string' },
            imageMetadata: { type: 'object' },
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
      
      // Step 1: Generate meme text/concept using the character
      const memePrompt = `Create a funny meme concept about: ${request.body.prompt}
      
      Describe the visual elements and any text that should appear in the meme.
      Be specific about what should be shown in the image.
      Make it witty and in character.`;

      const textResult = await orchestrator.generate({
        prompt: memePrompt,
        characterId: request.body.characterId,
        options: {
          ...request.body.options,
          temperature: 0.8,
          maxTokens: 200,
        },
        characterOptions: {
          context: {
            ...request.body.context,
            currentMood: {
              primary: 'humorous',
              secondary: ['creative', 'witty'],
              intensity: 85
            }
          },
          enforceConsistency: request.body.options?.enforceConsistency,
        },
      });

      // Step 2: Extract image prompt from character response
      const imagePrompt = extractImagePrompt(textResult.content, request.body.prompt);
      
      // Step 3: Generate the actual meme image
      const imageResult = await imageGenService.generateMemeImage(
        imagePrompt,
        getCharacterVisualStyle(request.body.characterId),
        {
          width: 512,
          height: 512,
          steps: 25,
          cfgScale: 7.5,
          style: 'meme',
          negativePrompt: 'text, words, letters, watermark, logo, blurry, bad quality'
        }
      );

      // Step 4: Return combined result
      return {
        content: textResult.content,
        imageUrl: imageResult.imageUrl,
        imagePath: imageResult.imagePath,
        imageMetadata: imageResult.metadata,
        ...textResult.characterResponse,
        providerId: textResult.providerId,
        modelId: textResult.modelId,
        usage: textResult.usage,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ 
        error: 'Failed to generate AI meme',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Serve generated images
  fastify.get<{
    Params: { filename: string };
  }>('/images/:filename', async (request, reply) => {
    try {
      const filepath = path.join(process.cwd(), 'generated-images', request.params.filename);
      const image = await fs.readFile(filepath);
      reply.type('image/png').send(image);
    } catch (error) {
      reply.code(404).send({ error: 'Image not found' });
    }
  });

  // Check AI image generation availability
  fastify.get('/meme/status', async (request, reply) => {
    const availability = await imageGenService.checkAvailability();
    return {
      available: availability.comfyui || availability.webui,
      backends: availability,
      message: availability.comfyui || availability.webui 
        ? 'AI image generation is available' 
        : 'No AI image generation backend found. Please start ComfyUI or WebUI.'
    };
  });
};

// Helper function to extract image prompt from character response
function extractImagePrompt(characterResponse: string, originalPrompt: string): string {
  // Look for visual descriptions in the response
  let imagePrompt = originalPrompt;
  
  // Extract any visual descriptions
  const visualMatch = characterResponse.match(/visual[s]?:?\s*([^.]+)/i);
  if (visualMatch) {
    imagePrompt = visualMatch[1];
  }
  
  // Look for "showing" or "depicting" phrases
  const showingMatch = characterResponse.match(/(?:showing|depicting|with)\s+([^.]+)/i);
  if (showingMatch) {
    imagePrompt += ', ' + showingMatch[1];
  }
  
  // Add meme-specific styling
  imagePrompt += ', meme style, funny, viral internet meme, trending';
  
  return imagePrompt;
}

// Get character-specific visual style
function getCharacterVisualStyle(characterId: string): string {
  // In a real implementation, this would look up the character's visual style
  // For now, return a generic meme style
  return 'cartoon style, expressive, humorous';
}

export default memeAIRoutes;