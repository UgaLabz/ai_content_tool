import { LLMProvider } from '../../../models/types';
import { TaskComplexity, TaskRequirements } from './TaskAnalyzer';
import { ProviderMetrics } from '../HybridOrchestrator';
import { logger } from '../../../utils/logger';

export interface PerformancePrediction {
  provider: string;
  estimatedLatency: number; // milliseconds
  confidence: number; // 0-1
  factors: {
    baseLatency: number;
    tokenProcessingTime: number;
    networkOverhead: number;
    queueTime: number;
    modelLoadTime: number;
  };
  throughput: number; // tokens per second
  reliability: number; // 0-1 success probability
}

export interface PerformanceHistory {
  provider: string;
  timestamp: Date;
  actualLatency: number;
  tokenCount: number;
  success: boolean;
  modelId: string;
}

export class PerformancePredictor {
  private historyBuffer: PerformanceHistory[] = [];
  private readonly maxHistorySize = 1000;
  
  // Performance baselines (milliseconds)
  private baselines = {
    local: {
      startup: 100,
      perTokenInput: 0.5,
      perTokenOutput: 2,
      networkOverhead: 10,
    },
    cloud: {
      startup: 200,
      perTokenInput: 0.1,
      perTokenOutput: 0.5,
      networkOverhead: 50,
    },
  };
  
  predict(
    provider: LLMProvider,
    requirements: TaskRequirements,
    complexity: TaskComplexity,
    metrics?: ProviderMetrics
  ): PerformancePrediction {
    const baseline = provider.type === 'local' ? this.baselines.local : this.baselines.cloud;
    
    // Base latency calculation
    let baseLatency = baseline.startup;
    
    // Add model-specific adjustments
    const modelSize = this.estimateModelSize(provider);
    switch (modelSize) {
      case 'small':
        baseLatency *= 0.5;
        break;
      case 'medium':
        baseLatency *= 1.0;
        break;
      case 'large':
        baseLatency *= 2.0;
        break;
      case 'xlarge':
        baseLatency *= 4.0;
        break;
    }
    
    // Token processing time
    const inputTokens = requirements.estimatedTokens * 0.6;
    const outputTokens = requirements.estimatedTokens * 0.4;
    const tokenProcessingTime = 
      (inputTokens * baseline.perTokenInput) +
      (outputTokens * baseline.perTokenOutput);
    
    // Network overhead
    let networkOverhead = baseline.networkOverhead;
    if (provider.type === 'local') {
      networkOverhead = 10; // Local network is fast
    } else {
      // Cloud providers have variable network latency
      networkOverhead = 50 + (Math.random() * 50); // 50-100ms
    }
    
    // Queue time estimation
    let queueTime = 0;
    if (metrics && metrics.totalRequests > 0) {
      const utilizationRate = metrics.totalRequests / (Date.now() - metrics.lastUsed.getTime());
      if (utilizationRate > 0.01) { // More than 1 request per 100ms
        queueTime = 100 * utilizationRate;
      }
    }
    
    // Model load time (for local providers)
    let modelLoadTime = 0;
    if (provider.type === 'local' && (!metrics || metrics.totalRequests === 0)) {
      // First request might need to load model
      modelLoadTime = modelSize === 'large' ? 5000 : modelSize === 'medium' ? 2000 : 500;
    }
    
    // Historical adjustment
    const historicalAdjustment = this.getHistoricalAdjustment(provider.name, requirements);
    
    // Total estimated latency
    const estimatedLatency = 
      baseLatency + 
      tokenProcessingTime + 
      networkOverhead + 
      queueTime + 
      modelLoadTime +
      historicalAdjustment;
    
    // Calculate throughput
    const throughput = outputTokens / (tokenProcessingTime / 1000); // tokens per second
    
    // Reliability score
    const reliability = this.calculateReliability(provider, metrics);
    
    // Confidence calculation
    const confidence = this.calculateConfidence(provider.name, requirements);
    
    const prediction: PerformancePrediction = {
      provider: provider.name,
      estimatedLatency,
      confidence,
      factors: {
        baseLatency,
        tokenProcessingTime,
        networkOverhead,
        queueTime,
        modelLoadTime,
      },
      throughput,
      reliability,
    };
    
    logger.debug({ prediction }, 'Performance prediction calculated');
    
    return prediction;
  }
  
  recordActualPerformance(
    providerName: string,
    actualLatency: number,
    tokenCount: number,
    success: boolean,
    modelId: string
  ): void {
    const record: PerformanceHistory = {
      provider: providerName,
      timestamp: new Date(),
      actualLatency,
      tokenCount,
      success,
      modelId,
    };
    
    this.historyBuffer.push(record);
    
    // Maintain buffer size
    if (this.historyBuffer.length > this.maxHistorySize) {
      this.historyBuffer.shift();
    }
    
    logger.debug({ record }, 'Recorded actual performance');
  }
  
  private getHistoricalAdjustment(providerName: string, requirements: TaskRequirements): number {
    const relevantHistory = this.historyBuffer.filter(
      h => h.provider === providerName && 
           h.timestamp > new Date(Date.now() - 3600000) && // Last hour
           Math.abs(h.tokenCount - requirements.estimatedTokens) < requirements.estimatedTokens * 0.5
    );
    
    if (relevantHistory.length === 0) return 0;
    
    // Calculate average difference between predicted and actual
    const avgLatency = relevantHistory.reduce((sum, h) => sum + h.actualLatency, 0) / relevantHistory.length;
    const expectedLatency = requirements.estimatedTokens * 2; // Simple baseline
    
    return avgLatency - expectedLatency;
  }
  
  private calculateReliability(provider: LLMProvider, metrics?: ProviderMetrics): number {
    if (!metrics || metrics.totalRequests === 0) {
      // No history, assume good reliability for local, moderate for cloud
      return provider.type === 'local' ? 0.95 : 0.90;
    }
    
    const successRate = metrics.successRate;
    
    // Recent history weight
    const recentHistory = this.historyBuffer.filter(
      h => h.provider === provider.name && 
           h.timestamp > new Date(Date.now() - 900000) // Last 15 minutes
    );
    
    if (recentHistory.length > 0) {
      const recentSuccessRate = recentHistory.filter(h => h.success).length / recentHistory.length;
      // Weight recent history more heavily
      return successRate * 0.3 + recentSuccessRate * 0.7;
    }
    
    return successRate;
  }
  
  private calculateConfidence(providerName: string, requirements: TaskRequirements): number {
    const relevantHistory = this.historyBuffer.filter(
      h => h.provider === providerName &&
           Math.abs(h.tokenCount - requirements.estimatedTokens) < requirements.estimatedTokens * 0.3
    );
    
    if (relevantHistory.length === 0) return 0.5; // Low confidence with no history
    if (relevantHistory.length < 5) return 0.6;
    if (relevantHistory.length < 10) return 0.7;
    if (relevantHistory.length < 20) return 0.8;
    if (relevantHistory.length < 50) return 0.9;
    return 0.95; // High confidence with lots of history
  }
  
  private estimateModelSize(provider: LLMProvider): 'small' | 'medium' | 'large' | 'xlarge' {
    const modelName = provider.modelInfo?.name?.toLowerCase() || '';
    const modelId = provider.modelInfo?.id?.toLowerCase() || '';
    
    if (modelId.includes('gemma') || modelId.includes('7b') || modelId.includes('8b')) return 'small';
    if (modelId.includes('13b') || modelId.includes('14b')) return 'medium';
    if (modelId.includes('70b')) return 'large';
    if (modelId.includes('405b')) return 'xlarge';
    
    // Default based on context window
    const contextWindow = provider.modelInfo?.capabilities?.contextWindow || 4096;
    if (contextWindow >= 100000) return 'xlarge';
    if (contextWindow >= 32000) return 'large';
    if (contextWindow >= 8000) return 'medium';
    
    return 'small';
  }
  
  getPerformanceStats(providerName?: string): any {
    const history = providerName 
      ? this.historyBuffer.filter(h => h.provider === providerName)
      : this.historyBuffer;
    
    if (history.length === 0) {
      return { 
        avgLatency: 0, 
        minLatency: 0, 
        maxLatency: 0, 
        successRate: 0,
        totalRequests: 0 
      };
    }
    
    const latencies = history.map(h => h.actualLatency);
    const successCount = history.filter(h => h.success).length;
    
    return {
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      minLatency: Math.min(...latencies),
      maxLatency: Math.max(...latencies),
      successRate: successCount / history.length,
      totalRequests: history.length,
      providers: providerName ? [providerName] : [...new Set(history.map(h => h.provider))],
    };
  }
}