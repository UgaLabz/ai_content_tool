import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ConfigurableOrchestrator } from '../services/hybrid/ConfigurableOrchestrator';
import { logger } from '../utils/logger';

// Request schemas
const UpdateConfigSchema = z.object({
  providers: z.array(z.any()).optional(),
  costLimits: z.any().optional(),
  performanceThresholds: z.any().optional(),
  privacySettings: z.any().optional(),
  routingRules: z.array(z.any()).optional(),
});

const AddRoutingRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  priority: z.number(),
  enabled: z.boolean().default(true),
  conditions: z.object({
    taskType: z.string().optional(),
    complexity: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    promptPattern: z.string().optional(),
    tokenCount: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    requiresVision: z.boolean().optional(),
    requiresFunctions: z.boolean().optional(),
  }),
  actions: z.object({
    preferredProvider: z.string().optional(),
    requiredProviderType: z.enum(['local', 'cloud']).optional(),
    modelSizePreference: z.enum(['small', 'medium', 'large', 'xlarge']).optional(),
    maxCost: z.number().optional(),
    maxLatency: z.number().optional(),
  }),
});

const UpdateProviderPreferenceSchema = z.object({
  priority: z.number().optional(),
  enabled: z.boolean().optional(),
  maxRequestsPerMinute: z.number().optional(),
  costMultiplier: z.number().optional(),
  conditions: z.object({
    taskTypes: z.array(z.string()).optional(),
    complexityRange: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
    timeOfDay: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
  }).optional(),
});

export async function configRoutes(server: FastifyInstance) {
  const orchestrator = server.orchestrator as ConfigurableOrchestrator;
  
  // Get current configuration
  server.get('/api/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = await orchestrator.getConfiguration();
      return config;
    } catch (error) {
      logger.error({ error }, 'Failed to get configuration');
      return reply.code(500).send({ error: 'Failed to get configuration' });
    }
  });
  
  // Update configuration
  server.put('/api/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const updates = UpdateConfigSchema.parse(request.body);
      await orchestrator.updateConfiguration(updates);
      return { success: true, message: 'Configuration updated' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid configuration', details: error.errors });
      }
      logger.error({ error }, 'Failed to update configuration');
      return reply.code(500).send({ error: 'Failed to update configuration' });
    }
  });
  
  // Get routing rules
  server.get('/api/config/rules', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = await orchestrator.getConfiguration();
      return { rules: config.routingRules };
    } catch (error) {
      logger.error({ error }, 'Failed to get routing rules');
      return reply.code(500).send({ error: 'Failed to get routing rules' });
    }
  });
  
  // Add routing rule
  server.post('/api/config/rules', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rule = AddRoutingRuleSchema.parse(request.body);
      await orchestrator.addRoutingRule(rule);
      return { success: true, message: 'Routing rule added', rule };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid rule', details: error.errors });
      }
      logger.error({ error }, 'Failed to add routing rule');
      return reply.code(500).send({ error: 'Failed to add routing rule' });
    }
  });
  
  // Update routing rule
  server.put('/api/config/rules/:id', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updates = request.body;
      
      const config = await orchestrator.getConfiguration();
      const ruleIndex = config.routingRules.findIndex(r => r.id === id);
      
      if (ruleIndex < 0) {
        return reply.code(404).send({ error: 'Rule not found' });
      }
      
      config.routingRules[ruleIndex] = {
        ...config.routingRules[ruleIndex],
        ...updates,
      };
      
      await orchestrator.updateConfiguration({ routingRules: config.routingRules });
      return { success: true, message: 'Routing rule updated' };
    } catch (error) {
      logger.error({ error }, 'Failed to update routing rule');
      return reply.code(500).send({ error: 'Failed to update routing rule' });
    }
  });
  
  // Delete routing rule
  server.delete('/api/config/rules/:id', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      const config = await orchestrator.getConfiguration();
      const filteredRules = config.routingRules.filter(r => r.id !== id);
      
      if (filteredRules.length === config.routingRules.length) {
        return reply.code(404).send({ error: 'Rule not found' });
      }
      
      await orchestrator.updateConfiguration({ routingRules: filteredRules });
      return { success: true, message: 'Routing rule deleted' };
    } catch (error) {
      logger.error({ error }, 'Failed to delete routing rule');
      return reply.code(500).send({ error: 'Failed to delete routing rule' });
    }
  });
  
  // Get provider preferences
  server.get('/api/config/providers', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = await orchestrator.getConfiguration();
      return { providers: config.providers };
    } catch (error) {
      logger.error({ error }, 'Failed to get provider preferences');
      return reply.code(500).send({ error: 'Failed to get provider preferences' });
    }
  });
  
  // Update provider preference
  server.put('/api/config/providers/:name', async (request: FastifyRequest<{
    Params: { name: string }
  }>, reply: FastifyReply) => {
    try {
      const { name } = request.params;
      const preference = UpdateProviderPreferenceSchema.parse(request.body);
      
      await orchestrator.updateProviderPreference(name, preference);
      return { success: true, message: 'Provider preference updated' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid preference', details: error.errors });
      }
      logger.error({ error }, 'Failed to update provider preference');
      return reply.code(500).send({ error: 'Failed to update provider preference' });
    }
  });
}