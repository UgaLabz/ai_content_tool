import { 
  LLMProvider, 
  GenerationTask, 
  GenerationResult,
  GenerationOptions,
  Message 
} from '../../models/types';
import { logger } from '../../utils/logger';
import { HybridOrchestrator, ProviderMetrics } from './HybridOrchestrator';
import {
  TaskAnalyzer,
  ModelMatcher,
  CostOptimizer,
  PerformancePredictor,
  ResourceMonitor,
  TaskComplexity,
  TaskRequirements,
  ModelPreferences,
  CostConstraints,
} from './intelligence';

export interface IntelligentOrchestratorConfig {
  maxRetries?: number;
  fallbackEnabled?: boolean;
  privacyMode?: boolean;
  costConstraints?: CostConstraints;
  performanceTargets?: {
    maxLatency?: number;
    minThroughput?: number;
  };
  resourceMonitoring?: boolean;
  intelligenceEnabled?: boolean;
}

export class IntelligentOrchestrator extends HybridOrchestrator {
  private taskAnalyzer: TaskAnalyzer;
  private modelMatcher: ModelMatcher;
  private costOptimizer: CostOptimizer;
  private performancePredictor: PerformancePredictor;
  private resourceMonitor: ResourceMonitor;
  private intelligenceConfig: IntelligentOrchestratorConfig;
  
  constructor(config?: IntelligentOrchestratorConfig) {
    super({
      maxRetries: config?.maxRetries || 3,
      fallbackEnabled: config?.fallbackEnabled ?? true,
      loadBalancing: 'least-latency',
      privacyMode: config?.privacyMode || false,
    });
    
    this.intelligenceConfig = {
      intelligenceEnabled: true,
      resourceMonitoring: true,
      ...config,
    };
    
    // Initialize intelligence components
    this.taskAnalyzer = new TaskAnalyzer();
    this.modelMatcher = new ModelMatcher();
    this.costOptimizer = new CostOptimizer();
    this.performancePredictor = new PerformancePredictor();
    this.resourceMonitor = new ResourceMonitor();
    
    // Start resource monitoring if enabled
    if (this.intelligenceConfig.resourceMonitoring) {
      this.resourceMonitor.startMonitoring(5000); // Check every 5 seconds
    }
    
    logger.info({ config: this.intelligenceConfig }, 'Intelligent orchestrator initialized');
  }
  
  async selectProvider(task: GenerationTask): Promise<LLMProvider> {
    // Use basic selection if intelligence is disabled
    if (!this.intelligenceConfig.intelligenceEnabled) {
      return super.selectProvider(task);
    }
    
    try {
      // Analyze task complexity and requirements
      const complexity = this.taskAnalyzer.analyzeComplexity(task);
      const requirements = this.taskAnalyzer.analyzeRequirements(task);
      
      logger.debug({ 
        complexity: complexity.score, 
        recommendedSize: complexity.recommendedModelSize,
        requirements 
      }, 'Task analyzed');
      
      // Get healthy providers
      const availableProviders = await this.getHealthyProviders();
      if (availableProviders.length === 0) {
        throw new Error('No healthy providers available');
      }
      
      // Check resource availability
      const resourceRecommendation = this.resourceMonitor.getRecommendedProviderType();
      let eligibleProviders = availableProviders;
      
      if (resourceRecommendation === 'cloud') {
        logger.warn('Low system resources, preferring cloud providers');
        const cloudProviders = availableProviders.filter(p => p.type === 'cloud');
        if (cloudProviders.length > 0) {
          eligibleProviders = cloudProviders;
        }
      } else if (resourceRecommendation === 'local' || this.intelligenceConfig.privacyMode) {
        const localProviders = availableProviders.filter(p => p.type === 'local');
        if (localProviders.length > 0) {
          eligibleProviders = localProviders;
        }
      }
      
      // Build preferences
      const preferences: ModelPreferences = {
        preferLocal: this.intelligenceConfig.privacyMode || task.requirements?.privacy,
        preferredProviders: task.requirements?.preferredProvider ? [task.requirements.preferredProvider] : undefined,
        maxLatency: this.intelligenceConfig.performanceTargets?.maxLatency,
      };
      
      // Find best model match
      const bestMatch = this.modelMatcher.findBestMatch(
        eligibleProviders,
        complexity,
        requirements,
        preferences
      );
      
      if (!bestMatch) {
        logger.warn('No suitable model match found, falling back to basic selection');
        return super.selectProvider(task);
      }
      
      logger.info({
        selected: bestMatch.provider.name,
        score: bestMatch.score,
        reasons: bestMatch.reasons,
      }, 'Provider selected by intelligence layer');
      
      // Check cost constraints
      if (this.intelligenceConfig.costConstraints) {
        const costEstimate = this.costOptimizer.estimateCost(
          bestMatch.provider,
          requirements,
          bestMatch.model.id
        );
        
        if (this.intelligenceConfig.costConstraints.maxCostPerRequest &&
            costEstimate.estimatedCost > this.intelligenceConfig.costConstraints.maxCostPerRequest) {
          logger.warn({
            provider: bestMatch.provider.name,
            estimatedCost: costEstimate.estimatedCost,
            limit: this.intelligenceConfig.costConstraints.maxCostPerRequest,
          }, 'Provider exceeds cost limit, finding alternative');
          
          // Find cost-optimized alternative
          const costOptimized = this.costOptimizer.optimizeSelection(
            eligibleProviders,
            requirements,
            complexity,
            this.intelligenceConfig.costConstraints
          );
          
          if (costOptimized.length > 0) {
            return costOptimized[0];
          }
        }
      }
      
      // Predict performance
      const performancePrediction = this.performancePredictor.predict(
        bestMatch.provider,
        requirements,
        complexity,
        this.getProviderMetrics(bestMatch.provider.name)
      );
      
      logger.debug({
        provider: bestMatch.provider.name,
        estimatedLatency: performancePrediction.estimatedLatency,
        confidence: performancePrediction.confidence,
        reliability: performancePrediction.reliability,
      }, 'Performance prediction');
      
      // Check performance targets
      if (this.intelligenceConfig.performanceTargets?.maxLatency &&
          performancePrediction.estimatedLatency > this.intelligenceConfig.performanceTargets.maxLatency) {
        logger.warn('Provider may not meet latency target, but proceeding');
      }
      
      return bestMatch.provider;
      
    } catch (error) {
      logger.error({ error }, 'Intelligence layer failed, falling back to basic selection');
      return super.selectProvider(task);
    }
  }
  
  async executeWithFallback(task: GenerationTask): Promise<GenerationResult> {
    const startTime = Date.now();
    let selectedProvider: LLMProvider | null = null;
    
    try {
      // Let parent handle the execution with our intelligent provider selection
      const result = await super.executeWithFallback(task);
      
      // Record performance metrics if we have them
      if (result.provider && this.intelligenceConfig.intelligenceEnabled) {
        const actualLatency = Date.now() - startTime;
        const tokenCount = this.estimateTokenCount(result.text);
        
        this.performancePredictor.recordActualPerformance(
          result.provider,
          actualLatency,
          tokenCount,
          true,
          result.model
        );
        
        // Record cost if applicable
        if (result.usage) {
          const provider = this.getProvider(result.provider);
          if (provider) {
            const requirements = this.taskAnalyzer.analyzeRequirements(task);
            const costEstimate = this.costOptimizer.estimateCost(provider, requirements, result.model);
            this.costOptimizer.recordActualUsage(
              result.provider,
              costEstimate.estimatedCost,
              {
                input: result.usage.promptTokens || 0,
                output: result.usage.completionTokens || 0,
              }
            );
          }
        }
      }
      
      return result;
      
    } catch (error) {
      // Record failure metrics
      if (selectedProvider && this.intelligenceConfig.intelligenceEnabled) {
        const actualLatency = Date.now() - startTime;
        this.performancePredictor.recordActualPerformance(
          selectedProvider.name,
          actualLatency,
          0,
          false,
          selectedProvider.modelInfo?.id || 'unknown'
        );
      }
      
      throw error;
    }
  }
  
  // Intelligence layer specific methods
  
  getProviderMetrics(providerName: string): ProviderMetrics | undefined {
    return (this as any).metrics.get(providerName);
  }
  
  getProvider(providerName: string): LLMProvider | undefined {
    return (this as any).providers.get(providerName);
  }
  
  async getIntelligenceReport(): Promise<{
    taskAnalysis: {
      recentComplexities: number[];
      averageComplexity: number;
      taskTypes: Record<string, number>;
    };
    performance: any;
    costs: any;
    resources: any;
    recommendations: string[];
  }> {
    const perfStats = this.performancePredictor.getPerformanceStats();
    const costReport = this.costOptimizer.getUsageReport();
    const resources = this.resourceMonitor.getAverageResources(60000) || this.resourceMonitor.getCurrentResources();
    const alerts = this.resourceMonitor.getAlerts();
    
    const recommendations: string[] = [];
    
    // Resource-based recommendations
    if (resources.memory.usage > 80) {
      recommendations.push('Consider using cloud providers or smaller models due to high memory usage');
    }
    
    if (resources.cpu.usage > 80) {
      recommendations.push('High CPU usage detected - consider load balancing or cloud providers');
    }
    
    // Performance-based recommendations
    if (perfStats.avgLatency > 5000) {
      recommendations.push('Average latency is high - consider using faster models or cloud providers');
    }
    
    // Cost-based recommendations
    const totalCost = Object.values(costReport).reduce((sum: number, usage: any) => 
      sum + (usage.monthly || 0), 0
    );
    if (totalCost > 100) {
      recommendations.push('Monthly costs exceeding $100 - consider using more local providers');
    }
    
    return {
      taskAnalysis: {
        recentComplexities: [], // Would need to track this
        averageComplexity: 0,
        taskTypes: {},
      },
      performance: perfStats,
      costs: costReport,
      resources: {
        current: resources,
        alerts: alerts,
        recommendation: this.resourceMonitor.getRecommendedProviderType(),
      },
      recommendations,
    };
  }
  
  private estimateTokenCount(text: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
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
  
  shutdown(): void {
    if (this.intelligenceConfig.resourceMonitoring) {
      this.resourceMonitor.stopMonitoring();
    }
    logger.info('Intelligent orchestrator shutdown');
  }
}