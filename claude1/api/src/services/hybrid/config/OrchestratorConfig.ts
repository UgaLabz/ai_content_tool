import { z } from 'zod';
import { logger } from '../../../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

// Provider preference schema
const ProviderPreferenceSchema = z.object({
  name: z.string(),
  priority: z.number().min(0).max(100),
  enabled: z.boolean().default(true),
  maxRequestsPerMinute: z.number().optional(),
  costMultiplier: z.number().default(1.0),
  conditions: z.object({
    taskTypes: z.array(z.string()).optional(),
    complexityRange: z.object({
      min: z.number().min(1).max(10),
      max: z.number().min(1).max(10),
    }).optional(),
    timeOfDay: z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
    }).optional(),
  }).optional(),
});

// Cost limits schema
const CostLimitsSchema = z.object({
  maxCostPerRequest: z.number().positive().optional(),
  maxCostPerMinute: z.number().positive().optional(),
  maxCostPerHour: z.number().positive().optional(),
  maxCostPerDay: z.number().positive().optional(),
  maxCostPerMonth: z.number().positive().optional(),
  warningThreshold: z.number().min(0).max(1).default(0.8),
  actionOnLimit: z.enum(['reject', 'fallback', 'queue']).default('fallback'),
});

// Performance thresholds schema
const PerformanceThresholdsSchema = z.object({
  maxLatency: z.number().positive().optional(),
  minThroughput: z.number().positive().optional(),
  maxQueueTime: z.number().positive().optional(),
  timeoutMs: z.number().positive().default(30000),
  acceptableErrorRate: z.number().min(0).max(1).default(0.05),
});

// Privacy settings schema
const PrivacySettingsSchema = z.object({
  mode: z.enum(['strict', 'balanced', 'permissive']).default('balanced'),
  allowCloudProviders: z.boolean().default(true),
  allowDataLogging: z.boolean().default(false),
  requireEncryption: z.boolean().default(true),
  sensitiveDataPatterns: z.array(z.string()).optional(),
  excludeProviders: z.array(z.string()).optional(),
});

// Model routing rules schema
const RoutingRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  priority: z.number().min(0).max(100),
  enabled: z.boolean().default(true),
  conditions: z.object({
    taskType: z.string().optional(),
    complexity: z.object({
      min: z.number().min(1).max(10).optional(),
      max: z.number().min(1).max(10).optional(),
    }).optional(),
    promptPattern: z.string().optional(), // Regex pattern
    tokenCount: z.object({
      min: z.number().positive().optional(),
      max: z.number().positive().optional(),
    }).optional(),
    requiresVision: z.boolean().optional(),
    requiresFunctions: z.boolean().optional(),
  }),
  actions: z.object({
    preferredProvider: z.string().optional(),
    requiredProviderType: z.enum(['local', 'cloud']).optional(),
    modelSizePreference: z.enum(['small', 'medium', 'large', 'xlarge']).optional(),
    maxCost: z.number().positive().optional(),
    maxLatency: z.number().positive().optional(),
  }),
});

// Main orchestrator configuration schema
const OrchestratorConfigSchema = z.object({
  version: z.string().default('1.0'),
  providers: z.array(ProviderPreferenceSchema),
  costLimits: CostLimitsSchema,
  performanceThresholds: PerformanceThresholdsSchema,
  privacySettings: PrivacySettingsSchema,
  routingRules: z.array(RoutingRuleSchema),
  
  // Global settings
  intelligenceEnabled: z.boolean().default(true),
  resourceMonitoring: z.boolean().default(true),
  metricsRetentionDays: z.number().positive().default(30),
  debugMode: z.boolean().default(false),
});

export type OrchestratorConfig = z.infer<typeof OrchestratorConfigSchema>;
export type ProviderPreference = z.infer<typeof ProviderPreferenceSchema>;
export type CostLimits = z.infer<typeof CostLimitsSchema>;
export type PerformanceThresholds = z.infer<typeof PerformanceThresholdsSchema>;
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;
export type RoutingRule = z.infer<typeof RoutingRuleSchema>;

export class ConfigurationManager {
  private config: OrchestratorConfig;
  private configPath: string;
  private watchInterval: NodeJS.Timer | null = null;
  
  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'config', 'orchestrator.json');
    this.config = this.getDefaultConfig();
  }
  
  async load(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const parsedConfig = JSON.parse(configData);
      this.config = OrchestratorConfigSchema.parse(parsedConfig);
      logger.info({ configPath: this.configPath }, 'Configuration loaded successfully');
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        logger.warn('Configuration file not found, using defaults');
        await this.save(); // Save default config
      } else {
        logger.error({ error }, 'Failed to load configuration');
        throw error;
      }
    }
  }
  
  async save(): Promise<void> {
    try {
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
      logger.info({ configPath: this.configPath }, 'Configuration saved successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to save configuration');
      throw error;
    }
  }
  
  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }
  
  updateConfig(updates: Partial<OrchestratorConfig>): void {
    this.config = OrchestratorConfigSchema.parse({
      ...this.config,
      ...updates,
    });
    logger.info('Configuration updated');
  }
  
  // Provider preference methods
  
  getProviderPreferences(): ProviderPreference[] {
    return [...this.config.providers].sort((a, b) => b.priority - a.priority);
  }
  
  updateProviderPreference(name: string, updates: Partial<ProviderPreference>): void {
    const index = this.config.providers.findIndex(p => p.name === name);
    if (index >= 0) {
      this.config.providers[index] = {
        ...this.config.providers[index],
        ...updates,
      };
    } else {
      this.config.providers.push({
        name,
        priority: 50,
        enabled: true,
        ...updates,
      });
    }
  }
  
  // Routing rules methods
  
  getActiveRoutingRules(): RoutingRule[] {
    return this.config.routingRules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);
  }
  
  addRoutingRule(rule: RoutingRule): void {
    this.config.routingRules.push(rule);
  }
  
  updateRoutingRule(id: string, updates: Partial<RoutingRule>): void {
    const index = this.config.routingRules.findIndex(r => r.id === id);
    if (index >= 0) {
      this.config.routingRules[index] = {
        ...this.config.routingRules[index],
        ...updates,
      };
    }
  }
  
  deleteRoutingRule(id: string): void {
    this.config.routingRules = this.config.routingRules.filter(r => r.id !== id);
  }
  
  // Cost limit methods
  
  getCostLimits(): CostLimits {
    return { ...this.config.costLimits };
  }
  
  updateCostLimits(updates: Partial<CostLimits>): void {
    this.config.costLimits = {
      ...this.config.costLimits,
      ...updates,
    };
  }
  
  // Privacy settings methods
  
  getPrivacySettings(): PrivacySettings {
    return { ...this.config.privacySettings };
  }
  
  updatePrivacySettings(updates: Partial<PrivacySettings>): void {
    this.config.privacySettings = {
      ...this.config.privacySettings,
      ...updates,
    };
  }
  
  // Watch for configuration changes
  
  startWatching(intervalMs: number = 5000): void {
    if (this.watchInterval) return;
    
    this.watchInterval = setInterval(async () => {
      try {
        await this.load();
      } catch (error) {
        logger.error({ error }, 'Failed to reload configuration');
      }
    }, intervalMs);
    
    logger.info({ interval: intervalMs }, 'Configuration watching started');
  }
  
  stopWatching(): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
      logger.info('Configuration watching stopped');
    }
  }
  
  private getDefaultConfig(): OrchestratorConfig {
    return {
      version: '1.0',
      providers: [
        {
          name: 'Ollama',
          priority: 80,
          enabled: true,
          costMultiplier: 1.0,
        },
        {
          name: 'LMStudio',
          priority: 75,
          enabled: true,
          costMultiplier: 1.0,
        },
        {
          name: 'LocalAI',
          priority: 70,
          enabled: true,
          costMultiplier: 1.2,
        },
      ],
      costLimits: {
        warningThreshold: 0.8,
        actionOnLimit: 'fallback',
      },
      performanceThresholds: {
        timeoutMs: 30000,
        acceptableErrorRate: 0.05,
      },
      privacySettings: {
        mode: 'balanced',
        allowCloudProviders: true,
        allowDataLogging: false,
        requireEncryption: true,
      },
      routingRules: [
        {
          id: 'prefer-local-for-privacy',
          name: 'Prefer Local for Privacy',
          priority: 90,
          enabled: true,
          conditions: {
            promptPattern: '(personal|private|confidential|secret)',
          },
          actions: {
            requiredProviderType: 'local',
          },
        },
        {
          id: 'use-small-models-for-simple',
          name: 'Use Small Models for Simple Tasks',
          priority: 80,
          enabled: true,
          conditions: {
            complexity: { max: 3 },
          },
          actions: {
            modelSizePreference: 'small',
            maxCost: 0.01,
          },
        },
      ],
      intelligenceEnabled: true,
      resourceMonitoring: true,
      metricsRetentionDays: 30,
      debugMode: false,
    };
  }
}