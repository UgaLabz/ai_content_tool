import { 
  LLMProvider, 
  GenerationTask, 
  GenerationResult,
  GenerationOptions,
  Message 
} from '../../models/types';
import { logger } from '../../utils/logger';

export interface ProviderMetrics {
  averageLatency: number;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
  lastUsed: Date;
}

export interface OrchestratorConfig {
  maxRetries: number;
  fallbackEnabled: boolean;
  loadBalancing: 'round-robin' | 'least-latency' | 'random';
  privacyMode: boolean;
}

export class HybridOrchestrator {
  private providers: Map<string, LLMProvider> = new Map();
  private metrics: Map<string, ProviderMetrics> = new Map();
  private config: OrchestratorConfig;
  private currentProviderIndex = 0;
  
  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = {
      maxRetries: config?.maxRetries || 3,
      fallbackEnabled: config?.fallbackEnabled ?? true,
      loadBalancing: config?.loadBalancing || 'least-latency',
      privacyMode: config?.privacyMode || false,
      ...config
    };
  }
  
  registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
    this.metrics.set(provider.name, {
      averageLatency: 0,
      successRate: 1,
      totalRequests: 0,
      failedRequests: 0,
      lastUsed: new Date()
    });
    
    logger.info({ provider: provider.name, type: provider.type }, 'Provider registered');
  }
  
  unregisterProvider(providerName: string): void {
    this.providers.delete(providerName);
    this.metrics.delete(providerName);
    logger.info({ provider: providerName }, 'Provider unregistered');
  }
  
  async selectProvider(task: GenerationTask): Promise<LLMProvider> {
    const availableProviders = await this.getHealthyProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No healthy providers available');
    }
    
    if (this.config.privacyMode || task.requirements?.privacy) {
      const localProviders = availableProviders.filter(p => p.type === 'local');
      if (localProviders.length > 0) {
        return this.selectByStrategy(localProviders);
      }
    }
    
    if (task.requirements?.preferredProvider) {
      const preferred = availableProviders.find(
        p => p.name === task.requirements.preferredProvider
      );
      if (preferred) return preferred;
    }
    
    const complexity = task.requirements?.complexity || this.estimateComplexity(task.prompt);
    
    if (complexity < 3) {
      const lightProviders = availableProviders.filter(
        p => p.modelInfo.size.includes('2B') || p.modelInfo.size.includes('7B')
      );
      if (lightProviders.length > 0) {
        return this.selectByStrategy(lightProviders);
      }
    }
    
    return this.selectByStrategy(availableProviders);
  }
  
  async executeWithFallback(task: GenerationTask): Promise<GenerationResult> {
    const errors: Array<{ provider: string; error: Error }> = [];
    let lastResult: GenerationResult | null = null;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const provider = await this.selectProvider(task);
        const startTime = Date.now();
        
        logger.info({ 
          provider: provider.name, 
          attempt: attempt + 1 
        }, 'Executing generation task');
        
        const messages: Message[] = task.context?.conversationHistory || [
          { role: 'user', content: task.prompt }
        ];
        
        if (task.options.systemPrompt) {
          messages.unshift({ 
            role: 'system', 
            content: task.options.systemPrompt 
          });
        }
        
        const result = await provider.generateCompletion(messages, task.options);
        
        this.updateMetrics(provider.name, true, Date.now() - startTime);
        
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        errors.push({ 
          provider: (await this.selectProvider(task)).name, 
          error: err 
        });
        
        logger.error({ 
          error: err, 
          attempt: attempt + 1 
        }, 'Generation attempt failed');
        
        if (!this.config.fallbackEnabled) {
          throw err;
        }
      }
    }
    
    const errorSummary = errors
      .map(e => `${e.provider}: ${e.error.message}`)
      .join('; ');
    
    throw new Error(`All generation attempts failed: ${errorSummary}`);
  }
  
  async benchmarkProviders(): Promise<Map<string, ProviderMetrics>> {
    const testPrompt = "Complete this sentence: The quick brown fox";
    const testOptions: GenerationOptions = {
      maxTokens: 50,
      temperature: 0.7
    };
    
    for (const [name, provider] of this.providers) {
      try {
        const startTime = Date.now();
        await provider.generateText(testPrompt, testOptions);
        const latency = Date.now() - startTime;
        
        this.updateMetrics(name, true, latency);
      } catch (error) {
        this.updateMetrics(name, false, 0);
      }
    }
    
    return new Map(this.metrics);
  }
  
  getProviderMetrics(providerName: string): ProviderMetrics | undefined {
    return this.metrics.get(providerName);
  }
  
  private async getHealthyProviders(): Promise<LLMProvider[]> {
    const healthChecks = await Promise.all(
      Array.from(this.providers.values()).map(async provider => {
        try {
          const health = await provider.checkHealth();
          return { provider, healthy: health.healthy };
        } catch {
          return { provider, healthy: false };
        }
      })
    );
    
    return healthChecks
      .filter(check => check.healthy)
      .map(check => check.provider);
  }
  
  private selectByStrategy(providers: LLMProvider[]): LLMProvider {
    switch (this.config.loadBalancing) {
      case 'round-robin':
        const provider = providers[this.currentProviderIndex % providers.length];
        this.currentProviderIndex++;
        return provider;
        
      case 'least-latency':
        return providers.reduce((best, current) => {
          const bestMetrics = this.metrics.get(best.name)!;
          const currentMetrics = this.metrics.get(current.name)!;
          return currentMetrics.averageLatency < bestMetrics.averageLatency 
            ? current 
            : best;
        });
        
      case 'random':
        return providers[Math.floor(Math.random() * providers.length)];
        
      default:
        return providers[0];
    }
  }
  
  private estimateComplexity(prompt: string): number {
    const wordCount = prompt.split(/\s+/).length;
    const hasCode = /```[\s\S]*```/.test(prompt);
    const hasMultipleQuestions = (prompt.match(/\?/g) || []).length > 1;
    const hasTechnicalTerms = /\b(algorithm|implement|optimize|analyze|architecture)\b/i.test(prompt);
    
    let complexity = 1;
    
    if (wordCount > 100) complexity += 2;
    else if (wordCount > 50) complexity += 1;
    
    if (hasCode) complexity += 3;
    if (hasMultipleQuestions) complexity += 2;
    if (hasTechnicalTerms) complexity += 1;
    
    return Math.min(10, complexity);
  }
  
  private updateMetrics(
    providerName: string, 
    success: boolean, 
    latency: number
  ): void {
    const metrics = this.metrics.get(providerName);
    if (!metrics) return;
    
    metrics.totalRequests++;
    if (!success) {
      metrics.failedRequests++;
    }
    
    metrics.successRate = 
      (metrics.totalRequests - metrics.failedRequests) / metrics.totalRequests;
    
    if (success && latency > 0) {
      metrics.averageLatency = metrics.averageLatency === 0
        ? latency
        : (metrics.averageLatency * (metrics.totalRequests - 1) + latency) / metrics.totalRequests;
    }
    
    metrics.lastUsed = new Date();
  }
}