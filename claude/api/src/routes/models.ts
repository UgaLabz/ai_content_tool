import { FastifyPluginAsync } from 'fastify';

export const modelRoutes: FastifyPluginAsync = async (server) => {
  server.get('/', async (request, reply) => {
    const providers = Array.from(server.orchestrator['providers'].values());
    const allModels = await Promise.all(
      providers.map(async provider => {
        try {
          const models = await provider.listModels();
          return models.map(model => ({
            ...model,
            provider: provider.name,
            type: provider.type
          }));
        } catch (error) {
          request.log.error({ error, provider: provider.name }, 'Failed to list models');
          return [];
        }
      })
    );
    
    return { models: allModels.flat() };
  });
  
  server.get('/providers', async (request, reply) => {
    const providers = Array.from(server.orchestrator['providers'].values());
    const providerInfo = await Promise.all(
      providers.map(async provider => {
        const health = await provider.checkHealth();
        const metrics = server.orchestrator.getProviderMetrics(provider.name);
        
        return {
          name: provider.name,
          type: provider.type,
          healthy: health.healthy,
          latency: health.latency,
          metrics
        };
      })
    );
    
    return { providers: providerInfo };
  });
  
  server.post('/benchmark', async (request, reply) => {
    try {
      const results = await server.orchestrator.benchmarkProviders();
      const benchmarks = Array.from(results.entries()).map(([name, metrics]) => ({
        provider: name,
        ...metrics
      }));
      
      return { benchmarks };
    } catch (error) {
      request.log.error({ error }, 'Benchmark failed');
      reply.code(500);
      return { error: 'Benchmark failed' };
    }
  });
};