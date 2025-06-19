import { LLMProvider, ModelInfo } from '../../../models/types';
import { TaskComplexity, TaskRequirements } from './TaskAnalyzer';
import { logger } from '../../../utils/logger';

export interface ModelMatch {
  provider: LLMProvider;
  model: ModelInfo;
  score: number; // 0-100 match score
  reasons: string[];
}

export interface ModelPreferences {
  preferLocal?: boolean;
  preferredProviders?: string[];
  excludeProviders?: string[];
  maxCost?: number;
  maxLatency?: number;
}

export class ModelMatcher {
  private modelProfiles = {
    // Model size categories with typical capabilities
    small: {
      maxComplexity: 3,
      typicalParams: '2B-7B',
      goodFor: ['simple-chat', 'basic-completion', 'quick-responses'],
      contextWindow: 4096,
    },
    medium: {
      maxComplexity: 6,
      typicalParams: '8B-13B',
      goodFor: ['general-chat', 'code-generation', 'analysis', 'creative-writing'],
      contextWindow: 8192,
    },
    large: {
      maxComplexity: 8,
      typicalParams: '30B-70B',
      goodFor: ['complex-reasoning', 'advanced-code', 'detailed-analysis', 'research'],
      contextWindow: 32768,
    },
    xlarge: {
      maxComplexity: 10,
      typicalParams: '100B+',
      goodFor: ['expert-reasoning', 'complex-multi-step', 'specialized-domains'],
      contextWindow: 128000,
    },
  };
  
  findBestMatch(
    providers: LLMProvider[],
    complexity: TaskComplexity,
    requirements: TaskRequirements,
    preferences: ModelPreferences = {}
  ): ModelMatch | null {
    const matches: ModelMatch[] = [];
    
    for (const provider of providers) {
      // Apply provider filters
      if (preferences.excludeProviders?.includes(provider.name)) continue;
      
      // Check if provider is healthy
      const health = provider.checkHealth ? provider.checkHealth() : Promise.resolve({ healthy: true });
      if (!health || !(health instanceof Promise ? true : health.healthy)) continue;
      
      // Get model info
      const modelInfo = provider.modelInfo;
      if (!modelInfo) continue;
      
      // Calculate match score
      const match = this.calculateMatchScore(
        provider,
        modelInfo,
        complexity,
        requirements,
        preferences
      );
      
      if (match.score > 0) {
        matches.push(match);
      }
    }
    
    // Sort by score (highest first)
    matches.sort((a, b) => b.score - a.score);
    
    // Apply preferences
    if (preferences.preferLocal) {
      const localMatch = matches.find(m => m.provider.type === 'local');
      if (localMatch && localMatch.score >= 70) {
        return localMatch;
      }
    }
    
    if (preferences.preferredProviders?.length) {
      for (const preferred of preferences.preferredProviders) {
        const preferredMatch = matches.find(m => m.provider.name === preferred);
        if (preferredMatch && preferredMatch.score >= 60) {
          return preferredMatch;
        }
      }
    }
    
    // Return best match
    return matches[0] || null;
  }
  
  private calculateMatchScore(
    provider: LLMProvider,
    model: ModelInfo,
    complexity: TaskComplexity,
    requirements: TaskRequirements,
    preferences: ModelPreferences
  ): ModelMatch {
    let score = 100;
    const reasons: string[] = [];
    
    // Check hard requirements
    if (!model.capabilities) {
      return { provider, model, score: 0, reasons: ['No capability information'] };
    }
    
    // Context window requirement
    if (requirements.minContextWindow > model.capabilities.contextWindow) {
      return { provider, model, score: 0, reasons: ['Context window too small'] };
    }
    
    // Function calling requirement
    if (requirements.needsFunctionCalling && !model.capabilities.supportsFunctions) {
      return { provider, model, score: 0, reasons: ['No function calling support'] };
    }
    
    // Vision requirement
    if (requirements.needsVision && !model.capabilities.supportsVision) {
      return { provider, model, score: 0, reasons: ['No vision support'] };
    }
    
    // Streaming requirement
    if (requirements.needsStreaming && !model.capabilities.supportsStreaming) {
      score -= 20;
      reasons.push('No streaming support');
    }
    
    // Model size vs complexity matching
    const modelSize = this.estimateModelSize(model);
    const sizeProfile = this.modelProfiles[modelSize];
    
    if (complexity.score > sizeProfile.maxComplexity) {
      const overComplexity = complexity.score - sizeProfile.maxComplexity;
      score -= overComplexity * 10;
      reasons.push(`Model may be too small for complexity ${complexity.score}`);
    } else if (complexity.score < sizeProfile.maxComplexity - 3) {
      // Penalize using overly large models for simple tasks
      score -= 10;
      reasons.push('Model may be larger than needed');
    } else {
      reasons.push('Good model size match');
    }
    
    // Task type matching
    const taskTypeScore = this.scoreTaskTypeMatch(requirements.taskType, model);
    score = Math.min(score, score * taskTypeScore);
    if (taskTypeScore < 0.8) {
      reasons.push(`Suboptimal for ${requirements.taskType} tasks`);
    } else {
      reasons.push(`Well-suited for ${requirements.taskType}`);
    }
    
    // Provider type preferences
    if (preferences.preferLocal && provider.type === 'local') {
      score += 10;
      reasons.push('Local provider preferred');
    } else if (!preferences.preferLocal && provider.type === 'cloud') {
      score += 5;
      reasons.push('Cloud provider available');
    }
    
    // Specific task factor bonuses
    if (complexity.factors.codeGeneration && model.name.toLowerCase().includes('code')) {
      score += 15;
      reasons.push('Specialized for code generation');
    }
    
    if (complexity.factors.multiModal && model.capabilities.supportsVision) {
      score += 10;
      reasons.push('Multi-modal capable');
    }
    
    // Normalize score
    score = Math.max(0, Math.min(100, score));
    
    logger.debug({ provider: provider.name, model: model.name, score, reasons }, 'Model match calculated');
    
    return { provider, model, score, reasons };
  }
  
  private estimateModelSize(model: ModelInfo): 'small' | 'medium' | 'large' | 'xlarge' {
    const name = model.name.toLowerCase();
    const size = model.size?.toLowerCase() || '';
    
    // Check explicit size indicators
    if (size.includes('2b') || size.includes('3b') || name.includes('gemma')) return 'small';
    if (size.includes('7b') || size.includes('8b') || name.includes('mistral-7b')) return 'small';
    if (size.includes('13b') || size.includes('14b')) return 'medium';
    if (size.includes('30b') || size.includes('34b') || size.includes('70b')) return 'large';
    if (size.includes('100b') || size.includes('405b')) return 'xlarge';
    
    // Check name patterns
    if (name.includes('small') || name.includes('mini') || name.includes('tiny')) return 'small';
    if (name.includes('medium') || name.includes('base')) return 'medium';
    if (name.includes('large') || name.includes('xl')) return 'large';
    if (name.includes('xxl') || name.includes('ultra')) return 'xlarge';
    
    // Check context window as proxy for size
    const contextWindow = model.capabilities?.contextWindow || 4096;
    if (contextWindow >= 100000) return 'xlarge';
    if (contextWindow >= 32000) return 'large';
    if (contextWindow >= 8000) return 'medium';
    
    return 'small';
  }
  
  private scoreTaskTypeMatch(taskType: string, model: ModelInfo): number {
    const modelName = model.name.toLowerCase();
    
    switch (taskType) {
      case 'code':
        if (modelName.includes('code') || modelName.includes('deepseek')) return 1.0;
        if (modelName.includes('llama') || modelName.includes('mistral')) return 0.8;
        return 0.6;
        
      case 'creative':
        if (modelName.includes('llama') || modelName.includes('claude')) return 1.0;
        if (modelName.includes('gpt')) return 0.9;
        return 0.7;
        
      case 'analysis':
        if (modelName.includes('llama') && model.size?.includes('70b')) return 1.0;
        if (modelName.includes('gpt-4') || modelName.includes('claude')) return 1.0;
        return 0.8;
        
      case 'chat':
        // Most models are good at chat
        return 0.9;
        
      default:
        return 0.8;
    }
  }
}