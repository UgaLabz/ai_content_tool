import { CharacterAwareOrchestrator } from './CharacterAwareOrchestrator';
import { PromptCache, EmbeddingCache } from '../cache/CacheService';
import { HttpConnectionPool } from '../pool/HttpConnectionPool';
import { TextGenerationBatchProcessor } from '../batch/BatchProcessor';
import { PromptOptimizer, ConversationOptimizer } from '../optimization/PromptOptimizer';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';
import { GenerationTask, GenerationResult } from '../../models/generation';
import { logger } from '../../utils/logger';

export interface OptimizedOrchestratorConfig {
  enableCaching?: boolean;
  enableBatching?: boolean;
  enablePromptOptimization?: boolean;
  enableConnectionPooling?: boolean;
  enablePerformanceMonitoring?: boolean;
  cacheConfig?: {
    ttl?: number;
    maxSize?: number;
  };
  batchConfig?: {
    maxBatchSize?: number;
    maxWaitTime?: number;
  };
  poolConfig?: {
    minConnections?: number;
    maxConnections?: number;
  };
}

export class OptimizedOrchestrator extends CharacterAwareOrchestrator {
  private promptCache?: PromptCache;
  private embeddingCache?: EmbeddingCache;
  private connectionPools: Map<string, HttpConnectionPool> = new Map();
  private batchProcessors: Map<string, TextGenerationBatchProcessor> = new Map();
  private promptOptimizer?: PromptOptimizer;
  private conversationOptimizer?: ConversationOptimizer;
  private performanceMonitor?: PerformanceMonitor;
  private optimizationConfig: Required<OptimizedOrchestratorConfig>;
  
  constructor(
    config?: ConstructorParameters<typeof CharacterAwareOrchestrator>[0],
    characterServiceConfig?: ConstructorParameters<typeof CharacterAwareOrchestrator>[1],
    optimizationConfig?: OptimizedOrchestratorConfig
  ) {
    super(config, characterServiceConfig);
    
    this.optimizationConfig = {
      enableCaching: optimizationConfig?.enableCaching !== false,
      enableBatching: optimizationConfig?.enableBatching !== false,
      enablePromptOptimization: optimizationConfig?.enablePromptOptimization !== false,
      enableConnectionPooling: optimizationConfig?.enableConnectionPooling !== false,
      enablePerformanceMonitoring: optimizationConfig?.enablePerformanceMonitoring !== false,
      cacheConfig: optimizationConfig?.cacheConfig || {},
      batchConfig: optimizationConfig?.batchConfig || {},
      poolConfig: optimizationConfig?.poolConfig || {},
    };
  }
  
  async initialize(): Promise<void> {
    await super.initialize();
    
    // Initialize caching
    if (this.optimizationConfig.enableCaching) {
      this.promptCache = new PromptCache();
      this.embeddingCache = new EmbeddingCache();
      logger.info('Caching system initialized');
    }
    
    // Initialize prompt optimization
    if (this.optimizationConfig.enablePromptOptimization) {
      this.promptOptimizer = new PromptOptimizer();
      this.conversationOptimizer = new ConversationOptimizer();
      logger.info('Prompt optimization initialized');
    }
    
    // Initialize performance monitoring
    if (this.optimizationConfig.enablePerformanceMonitoring) {
      this.performanceMonitor = new PerformanceMonitor({
        interval: 10000,
        enableAlerts: true,
      });
      this.performanceMonitor.start();
      
      // Subscribe to alerts
      this.performanceMonitor.on('alert', (alert) => {
        logger.warn({ alert }, 'Performance alert triggered');
      });
      
      logger.info('Performance monitoring initialized');
    }
    
    logger.info('Optimized orchestrator initialized');
  }
  
  /**
   * Generate with optimizations
   */
  async generate(task: GenerationTask): Promise<GenerationResult> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start performance tracking
    if (this.performanceMonitor) {
      this.performanceMonitor.recordRequestStart(requestId, {
        taskId: task.id,
        characterId: (task as any).characterId,
      });
    }
    
    try {
      // Check cache first
      if (this.optimizationConfig.enableCaching && this.promptCache) {
        const cacheKey = this.promptCache.generatePromptKey(
          task.prompt,
          task.requirements?.model || 'default',
          task.options
        );
        
        const cached = await this.promptCache.get(cacheKey);
        if (cached) {
          logger.debug({ taskId: task.id, cacheKey }, 'Cache hit');
          
          // Record cache hit
          if (this.performanceMonitor) {
            this.performanceMonitor.recordRequestEnd(requestId, true, {
              modelId: 'cache',
              provider: 'cache',
            });
          }
          
          return JSON.parse(cached);
        }
      }
      
      // Optimize prompt if enabled
      let optimizedPrompt = task.prompt;
      if (this.optimizationConfig.enablePromptOptimization && this.promptOptimizer) {
        const optimization = await this.promptOptimizer.optimize(task.prompt, {
          maxTokens: task.options?.maxTokens,
          compressionLevel: 'moderate',
        });
        
        if (optimization.tokenReduction > 0) {
          optimizedPrompt = optimization.optimized;
          logger.debug({
            taskId: task.id,
            tokenReduction: optimization.tokenReduction,
            compressionRatio: `${(optimization.compressionRatio * 100).toFixed(1)}%`,
          }, 'Prompt optimized');
        }
      }
      
      // Update task with optimized prompt
      const optimizedTask = { ...task, prompt: optimizedPrompt };
      
      // Check if batching is enabled and applicable
      if (this.optimizationConfig.enableBatching && this.shouldBatch(optimizedTask)) {
        return await this.generateWithBatching(optimizedTask, requestId);
      }
      
      // Regular generation (with character support if applicable)
      const result = await super.generate(optimizedTask);
      
      // Cache result
      if (this.optimizationConfig.enableCaching && this.promptCache) {
        const cacheKey = this.promptCache.generatePromptKey(
          task.prompt,
          result.modelId,
          task.options
        );
        
        await this.promptCache.set(cacheKey, JSON.stringify(result));
      }
      
      // Record performance metrics
      if (this.performanceMonitor) {
        this.performanceMonitor.recordRequestEnd(requestId, true, {
          modelId: result.modelId,
          provider: result.providerId,
          tokens: result.usage?.totalTokens,
        });
      }
      
      return result;
      
    } catch (error) {
      // Record failure
      if (this.performanceMonitor) {
        this.performanceMonitor.recordRequestEnd(requestId, false);
      }
      
      throw error;
    }
  }
  
  /**
   * Generate with batching
   */
  private async generateWithBatching(
    task: GenerationTask,
    requestId: string
  ): Promise<GenerationResult> {
    const selection = await this.selectProvider(task);
    const batchKey = `${selection.providerId}:${selection.modelId}`;
    
    // Get or create batch processor for this provider/model
    let batchProcessor = this.batchProcessors.get(batchKey);
    if (!batchProcessor) {
      batchProcessor = new TextGenerationBatchProcessor(selection.provider);
      this.batchProcessors.set(batchKey, batchProcessor);
    }
    
    // Add to batch
    const result = await batchProcessor.add({
      prompt: task.prompt,
      options: task.options,
    });
    
    // Record performance metrics
    if (this.performanceMonitor) {
      this.performanceMonitor.recordRequestEnd(requestId, true, {
        modelId: selection.modelId || 'unknown',
        provider: selection.providerId,
        tokens: task.prompt.length / 4, // Estimate
      });
    }
    
    return {
      content: result,
      providerId: selection.providerId,
      modelId: selection.modelId || 'unknown',
      usage: {
        promptTokens: Math.ceil(task.prompt.length / 4),
        completionTokens: Math.ceil(result.length / 4),
        totalTokens: Math.ceil((task.prompt.length + result.length) / 4),
      },
      latency: 0, // Batch processor doesn't track individual latencies
    };
  }
  
  /**
   * Determine if request should be batched
   */
  private shouldBatch(task: GenerationTask): boolean {
    // Don't batch streaming requests
    if (task.options?.stream) {
      return false;
    }
    
    // Don't batch large requests
    if (task.options?.maxTokens && task.options.maxTokens > 500) {
      return false;
    }
    
    // Don't batch character requests (they need special handling)
    if ((task as any).characterId) {
      return false;
    }
    
    // Don't batch high-priority requests
    if (task.priority === 'high') {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const stats: any = {
      cache: {
        prompt: this.promptCache?.getStats(),
        embedding: this.embeddingCache?.getStats(),
      },
      pools: {},
      batching: {},
      monitoring: this.performanceMonitor?.getCurrentMetrics(),
    };
    
    // Connection pool stats
    for (const [key, pool] of this.connectionPools) {
      stats.pools[key] = pool.getStats();
    }
    
    // Batch processor stats
    for (const [key, processor] of this.batchProcessors) {
      stats.batching[key] = processor.getStats();
    }
    
    return stats;
  }
  
  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down optimized orchestrator');
    
    // Stop performance monitoring
    if (this.performanceMonitor) {
      this.performanceMonitor.stop();
    }
    
    // Flush batch processors
    for (const processor of this.batchProcessors.values()) {
      await processor.shutdown();
    }
    
    // Drain connection pools
    for (const pool of this.connectionPools.values()) {
      await pool.drain();
    }
    
    // Clear caches
    if (this.promptCache) {
      await this.promptCache.clear();
    }
    if (this.embeddingCache) {
      await this.embeddingCache.clear();
    }
    
    await super.shutdown();
    
    logger.info('Optimized orchestrator shut down');
  }
  
  /**
   * Prune caches and cleanup resources
   */
  async performMaintenance(): Promise<void> {
    logger.info('Performing maintenance');
    
    // Prune caches
    if (this.promptCache) {
      const prunedPrompts = this.promptCache.prune();
      logger.info({ pruned: prunedPrompts }, 'Pruned prompt cache');
    }
    
    if (this.embeddingCache) {
      const prunedEmbeddings = this.embeddingCache.prune();
      logger.info({ pruned: prunedEmbeddings }, 'Pruned embedding cache');
    }
    
    // Log current stats
    const stats = this.getPerformanceStats();
    logger.info({ stats }, 'Current performance statistics');
  }
}