import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { OllamaService } from './services/local/ollama/OllamaService';
import { LMStudioService } from './services/local/lmstudio/LMStudioService';
import { LocalAIService } from './services/local/localai/LocalAIService';
import { OptimizedOrchestrator } from './services/hybrid/OptimizedOrchestrator';
import { setupRoutes } from './routes';
import compressionPlugin from './middleware/compression';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    ...(process.env.NODE_ENV !== 'production' && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    })
  },
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
  
  // Register compression middleware
  await server.register(compressionPlugin, {
    global: true,
    threshold: 1024, // 1KB
    encodings: ['gzip', 'deflate', 'br'],
  });
  
  const orchestrator = new OptimizedOrchestrator({
    fallbackEnabled: true,
    privacyMode: process.env.PRIVACY_MODE === 'true',
    intelligenceEnabled: process.env.DISABLE_INTELLIGENCE !== 'true',
    resourceMonitoring: process.env.ENABLE_RESOURCE_MONITORING !== 'false',
    configPath: process.env.CONFIG_PATH,
    autoReload: process.env.CONFIG_AUTO_RELOAD !== 'false',
    reloadInterval: process.env.CONFIG_RELOAD_INTERVAL ? parseInt(process.env.CONFIG_RELOAD_INTERVAL, 10) : 60000,
    costConstraints: {
      maxCostPerRequest: process.env.MAX_COST_PER_REQUEST ? parseFloat(process.env.MAX_COST_PER_REQUEST) : undefined,
      preferFreeProviders: process.env.PREFER_FREE_PROVIDERS === 'true',
    },
    performanceTargets: {
      maxLatency: process.env.MAX_LATENCY ? parseInt(process.env.MAX_LATENCY, 10) : undefined,
    },
  }, undefined, {
    enableCaching: process.env.DISABLE_CACHING !== 'true',
    enableBatching: process.env.ENABLE_BATCHING === 'true',
    enablePromptOptimization: process.env.ENABLE_PROMPT_OPTIMIZATION !== 'false',
    enableConnectionPooling: process.env.ENABLE_CONNECTION_POOLING !== 'false',
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
  });
  
  // Initialize orchestrator with configuration
  await orchestrator.initialize();
  
  const ollamaService = new OllamaService({
    host: process.env.OLLAMA_HOST,
    defaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'llama3.1:8b'
  });
  
  try {
    await ollamaService.initialize();
    orchestrator.registerProvider(ollamaService);
    server.log.info('Ollama service registered successfully');
  } catch (error) {
    server.log.warn({ error }, 'Failed to initialize Ollama service');
  }
  
  // Initialize LM Studio service
  const lmStudioService = new LMStudioService({
    baseUrl: process.env.LMSTUDIO_HOST || 'ws://localhost',
    port: parseInt(process.env.LMSTUDIO_PORT || '1234', 10),
    defaultModel: process.env.LMSTUDIO_DEFAULT_MODEL
  });
  
  try {
    await lmStudioService.initialize();
    orchestrator.registerProvider(lmStudioService);
    server.log.info('LM Studio service registered successfully');
  } catch (error) {
    server.log.warn({ error }, 'Failed to initialize LM Studio service');
  }
  
  // Initialize LocalAI service
  const localAIService = new LocalAIService({
    baseUrl: process.env.LOCALAI_HOST || 'http://localhost',
    port: parseInt(process.env.LOCALAI_PORT || '8080', 10),
    apiKey: process.env.LOCALAI_API_KEY || 'sk-localai-dummy',
    defaultModel: process.env.LOCALAI_DEFAULT_MODEL || 'llama3'
  });
  
  try {
    await localAIService.initialize();
    orchestrator.registerProvider(localAIService);
    server.log.info('LocalAI service registered successfully');
  } catch (error) {
    server.log.warn({ error }, 'Failed to initialize LocalAI service');
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
  
  // Intelligence report endpoint
  server.get('/api/intelligence/report', async (request, reply) => {
    try {
      const report = await orchestrator.getIntelligenceReport();
      return report;
    } catch (error) {
      server.log.error({ error }, 'Failed to generate intelligence report');
      return reply.code(500).send({ error: 'Failed to generate report' });
    }
  });
  
  // Performance stats endpoint
  server.get('/api/performance/stats', async (request, reply) => {
    try {
      const stats = orchestrator.getPerformanceStats();
      return stats;
    } catch (error) {
      server.log.error({ error }, 'Failed to get performance stats');
      return reply.code(500).send({ error: 'Failed to get stats' });
    }
  });
  
  // Maintenance endpoint
  server.post('/api/maintenance', async (request, reply) => {
    try {
      await orchestrator.performMaintenance();
      return { status: 'success', message: 'Maintenance completed' };
    } catch (error) {
      server.log.error({ error }, 'Failed to perform maintenance');
      return reply.code(500).send({ error: 'Failed to perform maintenance' });
    }
  });
  
  return server;
}

async function start() {
  try {
    const server = await buildServer();
    
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    
    server.log.info(`Server started on ${host}:${port}`);
    
    // Graceful shutdown
    const shutdown = async () => {
      server.log.info('Shutting down server...');
      const orchestrator = (server as any).orchestrator as OptimizedOrchestrator;
      if (orchestrator && orchestrator.shutdown) {
        orchestrator.shutdown();
      }
      await server.close();
      process.exit(0);
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { buildServer };