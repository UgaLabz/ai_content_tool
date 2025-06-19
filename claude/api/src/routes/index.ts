import { FastifyInstance } from 'fastify';
import { generationRoutes } from './generation';
import { modelRoutes } from './models';
import { chatRoutes } from './chat';

export async function setupRoutes(server: FastifyInstance) {
  await server.register(generationRoutes, { prefix: '/api/generate' });
  await server.register(modelRoutes, { prefix: '/api/models' });
  await server.register(chatRoutes, { prefix: '/api/chat' });
}