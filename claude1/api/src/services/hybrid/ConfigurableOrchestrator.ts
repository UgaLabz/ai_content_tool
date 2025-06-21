import { 
  LLMProvider, 
  GenerationTask, 
  GenerationResult 
} from '../../models/types';
import { logger } from '../../utils/logger';
import { IntelligentOrchestrator, IntelligentOrchestratorConfig } from './IntelligentOrchestrator';
import { ConfigurationManager, OrchestratorConfig } from './config/OrchestratorConfig';
import { RuleEngine } from './config/RuleEngine';

export interface ConfigurableOrchestratorOptions extends IntelligentOrchestratorConfig {
  configPath?: string;
  autoReload?: boolean;
  reloadInterval?: number;
}

export class ConfigurableOrchestrator extends IntelligentOrchestrator {
  private configManager: ConfigurationManager;
  private ruleEngine: RuleEngine;
  private options: ConfigurableOrchestratorOptions;
  
  constructor(options?: ConfigurableOrchestratorOptions) {
    super(options);
    
    this.options = {
      autoReload: true,
      reloadInterval: 60000, // 1 minute
      ...options,
    };
    
    this.configManager = new ConfigurationManager(options?.configPath);
    this.ruleEngine = new RuleEngine();
  }
  
  async initialize(): Promise<void> {
    // Load configuration
    await this.configManager.load();
    const config = this.configManager.getConfig();
    
    // Apply configuration
    this.applyConfiguration(config);
    
    // Start configuration watching if enabled
    if (this.options.autoReload) {
      this.configManager.startWatching(this.options.reloadInterval);
    }
    
    logger.info('Configurable orchestrator initialized');
  }
  
  async selectProvider(task: GenerationTask): Promise<LLMProvider> {
    const config = this.configManager.getConfig();
    
    // Use basic selection if intelligence is disabled in config
    if (!config.intelligenceEnabled) {
      return super.selectProvider(task);
    }
    
    try {
      // Get task analysis
      const taskAnalyzer = (this as any).taskAnalyzer;
      const complexity = taskAnalyzer.analyzeComplexity(task);
      const requirements = taskAnalyzer.analyzeRequirements(task);
      
      // Get healthy providers
      const availableProviders = await this.getHealthyProviders();
      if (availableProviders.length === 0) {
        throw new Error('No healthy providers available');
      }
      
      // Apply privacy settings
      let eligibleProviders = this.ruleEngine.enforcePrivacySettings(
        availableProviders,
        config.privacySettings.mode,
        config.privacySettings.excludeProviders
      );
      
      // Apply provider preferences
      eligibleProviders = this.ruleEngine.applyProviderPreferences(
        eligibleProviders,
        config.providers,
        task,
        complexity
      );
      
      // Evaluate routing rules
      const ruleResults = this.ruleEngine.evaluateRules(
        config.routingRules,
        task,
        complexity,
        requirements
      );
      
      // Apply rule actions if any rules matched
      if (ruleResults.length > 0) {
        const topRule = ruleResults[0];
        logger.info({ rule: topRule.rule.name, actions: topRule.actions }, 'Applying routing rule');
        
        // Filter by required provider type
        if (topRule.actions.requiredProviderType) {
          eligibleProviders = eligibleProviders.filter(
            p => p.type === topRule.actions.requiredProviderType
          );
        }
        
        // Filter by preferred provider
        if (topRule.actions.preferredProvider) {
          const preferred = eligibleProviders.find(
            p => p.name === topRule.actions.preferredProvider
          );
          if (preferred) {
            return preferred;
          }
        }
        
        // Apply additional constraints from rule
        task.requirements = {
          ...task.requirements,
          maxCost: topRule.actions.maxCost,
          maxLatency: topRule.actions.maxLatency,
        };
      }
      
      // Build preferences for model matcher
      const preferences = {
        preferLocal: config.privacySettings.mode === 'strict' || !config.privacySettings.allowCloudProviders,
        preferredProviders: config.providers
          .filter(p => p.enabled)
          .sort((a, b) => b.priority - a.priority)
          .map(p => p.name),
        maxCost: config.costLimits.maxCostPerRequest,
        maxLatency: config.performanceThresholds.maxLatency,
      };
      
      // Use model matcher to find best provider
      const modelMatcher = (this as any).modelMatcher;
      const bestMatch = modelMatcher.findBestMatch(
        eligibleProviders,
        complexity,
        requirements,
        preferences
      );
      
      if (!bestMatch) {
        logger.warn('No suitable model match found, using first available provider');
        return eligibleProviders[0];
      }
      
      // Validate against configuration constraints
      const costOptimizer = (this as any).costOptimizer;
      const performancePredictor = (this as any).performancePredictor;
      
      const costEstimate = costOptimizer.estimateCost(
        bestMatch.provider,
        requirements,
        bestMatch.model.id
      );
      
      const performanceEstimate = performancePredictor.predict(
        bestMatch.provider,
        requirements,
        complexity,
        this.getProviderMetrics(bestMatch.provider.name)
      );
      
      const validation = this.ruleEngine.validateConfiguration(
        task,
        bestMatch.provider,
        costEstimate.estimatedCost,
        performanceEstimate.estimatedLatency,
        {
          maxCostPerRequest: config.costLimits.maxCostPerRequest,
          maxLatency: config.performanceThresholds.maxLatency,
          requiredProviderType: ruleResults[0]?.actions.requiredProviderType,
        }
      );
      
      if (!validation.valid) {
        logger.warn({ reasons: validation.reasons }, 'Provider failed validation, finding alternative');
        
        // Try to find alternative provider
        for (const provider of eligibleProviders) {
          if (provider.name === bestMatch.provider.name) continue;
          
          const altCost = costOptimizer.estimateCost(provider, requirements);
          const altPerf = performancePredictor.predict(provider, requirements, complexity);
          
          const altValidation = this.ruleEngine.validateConfiguration(
            task,
            provider,
            altCost.estimatedCost,
            altPerf.estimatedLatency,
            {
              maxCostPerRequest: config.costLimits.maxCostPerRequest,
              maxLatency: config.performanceThresholds.maxLatency,
            }
          );
          
          if (altValidation.valid) {
            logger.info({ provider: provider.name }, 'Using alternative provider');
            return provider;
          }
        }
        
        // If no valid alternative, check action on limit
        if (config.costLimits.actionOnLimit === 'reject') {
          throw new Error(`No provider meets constraints: ${validation.reasons.join(', ')}`);
        } else if (config.costLimits.actionOnLimit === 'queue') {
          // TODO: Implement request queuing
          logger.warn('Request queuing not yet implemented, using best match');
        }
      }
      
      logger.info({
        selected: bestMatch.provider.name,
        score: bestMatch.score,
        cost: costEstimate.estimatedCost,
        latency: performanceEstimate.estimatedLatency,
      }, 'Provider selected with configuration validation');
      
      return bestMatch.provider;
      
    } catch (error) {
      logger.error({ error }, 'Configurable selection failed, falling back');
      return super.selectProvider(task);
    }
  }
  
  private applyConfiguration(config: OrchestratorConfig): void {
    // Update intelligence config
    (this as any).intelligenceConfig = {
      ...(this as any).intelligenceConfig,
      intelligenceEnabled: config.intelligenceEnabled,
      resourceMonitoring: config.resourceMonitoring,
      costConstraints: config.costLimits,
      performanceTargets: {
        maxLatency: config.performanceThresholds.maxLatency,
        minThroughput: config.performanceThresholds.minThroughput,
      },
    };
    
    // Update orchestrator config
    (this as any).config = {
      ...(this as any).config,
      privacyMode: config.privacySettings.mode === 'strict',
    };
    
    logger.info('Configuration applied to orchestrator');
  }
  
  private async getHealthyProviders(): Promise<LLMProvider[]> {
    const providers = Array.from((this as any).providers.values()) as LLMProvider[];
    const healthyProviders: LLMProvider[] = [];
    
    for (const provider of providers) {
      try {
        const health = await provider.checkHealth();
        if (health.healthy) {
          healthyProviders.push(provider);
        }
      } catch (error) {
        logger.warn({ provider: provider.name, error }, 'Health check failed');
      }
    }
    
    return healthyProviders;
  }
  
  async updateConfiguration(updates: Partial<OrchestratorConfig>): Promise<void> {
    this.configManager.updateConfig(updates);
    await this.configManager.save();
    this.applyConfiguration(this.configManager.getConfig());
  }
  
  async getConfiguration(): Promise<OrchestratorConfig> {
    return this.configManager.getConfig();
  }
  
  async addRoutingRule(rule: any): Promise<void> {
    this.configManager.addRoutingRule(rule);
    await this.configManager.save();
  }
  
  async updateProviderPreference(name: string, preference: any): Promise<void> {
    this.configManager.updateProviderPreference(name, preference);
    await this.configManager.save();
  }
  
  shutdown(): void {
    this.configManager.stopWatching();
    super.shutdown();
    logger.info('Configurable orchestrator shutdown');
  }
}