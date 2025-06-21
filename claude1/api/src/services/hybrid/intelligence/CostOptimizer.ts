import { LLMProvider } from '../../../models/types';
import { TaskComplexity, TaskRequirements } from './TaskAnalyzer';
import { logger } from '../../../utils/logger';

export interface CostEstimate {
  provider: string;
  estimatedCost: number;
  costPerToken: number;
  totalTokens: number;
  breakdown: {
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
  };
}

export interface CostConstraints {
  maxCostPerRequest?: number;
  dailyBudget?: number;
  monthlyBudget?: number;
  preferFreeProviders?: boolean;
}

export class CostOptimizer {
  // Approximate costs per 1K tokens (in USD)
  private providerCosts = {
    // Local providers (infrastructure cost estimates)
    Ollama: {
      input: 0.0001, // Electricity + amortized hardware
      output: 0.0001,
      infrastructure: 0.00001, // Per request overhead
    },
    LMStudio: {
      input: 0.0001,
      output: 0.0001,
      infrastructure: 0.00001,
    },
    LocalAI: {
      input: 0.0002, // Slightly higher due to Docker overhead
      output: 0.0002,
      infrastructure: 0.00002,
    },
    // Cloud providers (actual API costs)
    OpenAI: {
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
    },
    Claude: {
      'claude-instant': { input: 0.0008, output: 0.0024 },
      'claude-2': { input: 0.008, output: 0.024 },
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
    },
  };
  
  private usageTracking = new Map<string, {
    daily: number;
    monthly: number;
    lastReset: Date;
  }>();
  
  estimateCost(
    provider: LLMProvider,
    requirements: TaskRequirements,
    modelId?: string
  ): CostEstimate {
    const providerName = provider.name;
    const inputTokens = requirements.estimatedTokens * 0.6; // Assume 60% input
    const outputTokens = requirements.estimatedTokens * 0.4; // Assume 40% output
    
    let inputCost = 0;
    let outputCost = 0;
    let costPerToken = 0;
    
    if (provider.type === 'local') {
      // Local provider costs
      const costs = this.providerCosts[providerName as keyof typeof this.providerCosts];
      if (costs && 'input' in costs) {
        inputCost = (inputTokens / 1000) * costs.input;
        outputCost = (outputTokens / 1000) * costs.output;
        inputCost += costs.infrastructure;
      }
    } else {
      // Cloud provider costs
      const providerRates = this.providerCosts[providerName as keyof typeof this.providerCosts];
      if (providerRates && typeof providerRates === 'object' && modelId) {
        const modelRates = providerRates[modelId as keyof typeof providerRates];
        if (modelRates && 'input' in modelRates) {
          inputCost = (inputTokens / 1000) * modelRates.input;
          outputCost = (outputTokens / 1000) * modelRates.output;
        }
      }
    }
    
    const estimatedCost = inputCost + outputCost;
    costPerToken = estimatedCost / requirements.estimatedTokens;
    
    return {
      provider: providerName,
      estimatedCost,
      costPerToken,
      totalTokens: requirements.estimatedTokens,
      breakdown: {
        inputTokens,
        outputTokens,
        inputCost,
        outputCost,
      },
    };
  }
  
  optimizeSelection(
    providers: LLMProvider[],
    requirements: TaskRequirements,
    complexity: TaskComplexity,
    constraints: CostConstraints = {}
  ): LLMProvider[] {
    const eligibleProviders: Array<{
      provider: LLMProvider;
      cost: CostEstimate;
      score: number;
    }> = [];
    
    for (const provider of providers) {
      const cost = this.estimateCost(provider, requirements, provider.modelInfo?.id);
      
      // Check cost constraints
      if (constraints.maxCostPerRequest && cost.estimatedCost > constraints.maxCostPerRequest) {
        logger.debug({ provider: provider.name, cost: cost.estimatedCost }, 'Provider exceeds cost limit');
        continue;
      }
      
      // Check budget constraints
      if (!this.checkBudgetConstraints(provider.name, cost.estimatedCost, constraints)) {
        logger.debug({ provider: provider.name }, 'Provider exceeds budget constraints');
        continue;
      }
      
      // Calculate cost-effectiveness score
      const score = this.calculateCostEffectivenessScore(
        provider,
        cost,
        complexity,
        constraints
      );
      
      eligibleProviders.push({ provider, cost, score });
    }
    
    // Sort by cost-effectiveness score
    eligibleProviders.sort((a, b) => b.score - a.score);
    
    // If preferring free providers, prioritize local ones
    if (constraints.preferFreeProviders) {
      const localProviders = eligibleProviders.filter(p => p.provider.type === 'local');
      const cloudProviders = eligibleProviders.filter(p => p.provider.type === 'cloud');
      return [...localProviders, ...cloudProviders].map(p => p.provider);
    }
    
    return eligibleProviders.map(p => p.provider);
  }
  
  private calculateCostEffectivenessScore(
    provider: LLMProvider,
    cost: CostEstimate,
    complexity: TaskComplexity,
    constraints: CostConstraints
  ): number {
    let score = 100;
    
    // Base cost factor (lower cost = higher score)
    if (cost.estimatedCost === 0) {
      score += 50; // Free providers get bonus
    } else {
      score -= Math.log10(cost.estimatedCost * 10000) * 10;
    }
    
    // Local vs cloud preference
    if (provider.type === 'local') {
      score += constraints.preferFreeProviders ? 30 : 10;
    }
    
    // Complexity matching (avoid overpaying for simple tasks)
    if (complexity.score <= 3 && cost.estimatedCost > 0.001) {
      score -= 20; // Penalize expensive providers for simple tasks
    }
    
    // Model appropriateness
    const modelSize = this.estimateModelSizeFromProvider(provider);
    if (complexity.recommendedModelSize === modelSize) {
      score += 20;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  private checkBudgetConstraints(
    providerName: string,
    requestCost: number,
    constraints: CostConstraints
  ): boolean {
    // Initialize tracking if needed
    if (!this.usageTracking.has(providerName)) {
      this.usageTracking.set(providerName, {
        daily: 0,
        monthly: 0,
        lastReset: new Date(),
      });
    }
    
    const usage = this.usageTracking.get(providerName)!;
    const now = new Date();
    
    // Reset daily counter if needed
    if (now.getDate() !== usage.lastReset.getDate()) {
      usage.daily = 0;
      usage.lastReset = now;
    }
    
    // Reset monthly counter if needed
    if (now.getMonth() !== usage.lastReset.getMonth()) {
      usage.monthly = 0;
      usage.daily = 0;
      usage.lastReset = now;
    }
    
    // Check daily budget
    if (constraints.dailyBudget && usage.daily + requestCost > constraints.dailyBudget) {
      return false;
    }
    
    // Check monthly budget
    if (constraints.monthlyBudget && usage.monthly + requestCost > constraints.monthlyBudget) {
      return false;
    }
    
    // Update usage (this is speculative, should be confirmed after actual usage)
    usage.daily += requestCost;
    usage.monthly += requestCost;
    
    return true;
  }
  
  private estimateModelSizeFromProvider(provider: LLMProvider): 'small' | 'medium' | 'large' | 'xlarge' {
    const modelName = provider.modelInfo?.name?.toLowerCase() || '';
    const modelId = provider.modelInfo?.id?.toLowerCase() || '';
    
    if (modelName.includes('gemma') || modelId.includes('7b')) return 'small';
    if (modelId.includes('13b') || modelId.includes('14b')) return 'medium';
    if (modelId.includes('70b') || modelName.includes('gpt-4')) return 'large';
    if (modelId.includes('405b') || modelName.includes('opus')) return 'xlarge';
    
    // Default based on provider type
    return provider.type === 'local' ? 'medium' : 'large';
  }
  
  recordActualUsage(
    providerName: string,
    actualCost: number,
    actualTokens: { input: number; output: number }
  ): void {
    logger.info({
      provider: providerName,
      cost: actualCost,
      tokens: actualTokens,
    }, 'Recording actual usage');
    
    // This method should be called after successful generation
    // to update real usage statistics
  }
  
  getUsageReport(providerName?: string): any {
    if (providerName) {
      return this.usageTracking.get(providerName);
    }
    
    const report: any = {};
    for (const [name, usage] of this.usageTracking.entries()) {
      report[name] = usage;
    }
    return report;
  }
}