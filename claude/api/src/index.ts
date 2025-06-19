import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { logger } from './utils/logger';
import { OllamaService } from './services/local/ollama/OllamaService';
import { HybridOrchestrator } from './services/hybrid/HybridOrchestrator';
import { setupRoutes } from './routes';

const server = Fastify({
  logger: logger as any,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,
  trustProxy: true
});

async function buildServer() {
  await server.register(cors, {
    origin: true,
    credentials: true
  });
  
  await server.register(helmet, {
    contentSecurityPolicy: false
  });
  
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });
  
  const orchestrator = new HybridOrchestrator({
    fallbackEnabled: true,
    loadBalancing: 'least-latency',
    privacyMode: process.env.PRIVACY_MODE === 'true'
  });
  
  const ollamaService = new OllamaService({
    host: process.env.OLLAMA_HOST,
    defaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'llama3.1:8b'
  });
  
  try {
    await ollamaService.initialize();
    orchestrator.registerProvider(ollamaService);
    logger.info('Ollama service registered successfully');
  } catch (error) {
    logger.warn({ error }, 'Failed to initialize Ollama service');
  }
  
  server.decorate('orchestrator', orchestrator);
  
  await setupRoutes(server);
  
  server.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      providers: Array.from(orchestrator['providers'].keys())
    };
  });
  
  return server;
}

async function start() {
  try {
    const server = await buildServer();
    
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    
    logger.info(`Server started on ${host}:${port}`);
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { buildServer };