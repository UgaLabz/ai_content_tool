import { HybridOrchestrator } from '../services/hybrid/HybridOrchestrator';

declare module 'fastify' {
  interface FastifyInstance {
    orchestrator: HybridOrchestrator;
  }
}