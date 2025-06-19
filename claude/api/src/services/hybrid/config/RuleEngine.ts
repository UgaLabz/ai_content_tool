import { GenerationTask, LLMProvider } from '../../../models/types';
import { RoutingRule, ProviderPreference } from './OrchestratorConfig';
import { TaskComplexity, TaskRequirements } from '../intelligence/TaskAnalyzer';
import { logger } from '../../../utils/logger';

export interface RuleEvaluationResult {
  rule: RoutingRule;
  matched: boolean;
  score: number;
  actions: RoutingRule['actions'];
}

export class RuleEngine {
  evaluateRules(
    rules: RoutingRule[],
    task: GenerationTask,
    complexity: TaskComplexity,
    requirements: TaskRequirements
  ): RuleEvaluationResult[] {
    const results: RuleEvaluationResult[] = [];
    
    for (const rule of rules) {
      const evaluation = this.evaluateRule(rule, task, complexity, requirements);
      if (evaluation.matched) {
        results.push(evaluation);
      }
    }
    
    // Sort by rule priority and score
    results.sort((a, b) => {
      const priorityDiff = b.rule.priority - a.rule.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return b.score - a.score;
    });
    
    logger.debug({ 
      matchedRules: results.length,
      topRule: results[0]?.rule.name 
    }, 'Rules evaluated');
    
    return results;
  }
  
  private evaluateRule(
    rule: RoutingRule,
    task: GenerationTask,
    complexity: TaskComplexity,
    requirements: TaskRequirements
  ): RuleEvaluationResult {
    let matched = true;
    let score = 100;
    const conditions = rule.conditions;
    
    // Check task type
    if (conditions.taskType && conditions.taskType !== requirements.taskType) {
      matched = false;
    }
    
    // Check complexity range
    if (conditions.complexity) {
      if (conditions.complexity.min && complexity.score < conditions.complexity.min) {
        matched = false;
      }
      if (conditions.complexity.max && complexity.score > conditions.complexity.max) {
        matched = false;
      }
    }
    
    // Check prompt pattern
    if (conditions.promptPattern) {
      try {
        const pattern = new RegExp(conditions.promptPattern, 'i');
        if (!pattern.test(task.prompt)) {
          matched = false;
        } else {
          // Boost score for pattern match
          score += 20;
        }
      } catch (error) {
        logger.warn({ rule: rule.name, pattern: conditions.promptPattern }, 'Invalid regex pattern');
        matched = false;
      }
    }
    
    // Check token count
    if (conditions.tokenCount) {
      if (conditions.tokenCount.min && requirements.estimatedTokens < conditions.tokenCount.min) {
        matched = false;
      }
      if (conditions.tokenCount.max && requirements.estimatedTokens > conditions.tokenCount.max) {
        matched = false;
      }
    }
    
    // Check vision requirement
    if (conditions.requiresVision !== undefined && conditions.requiresVision !== requirements.needsVision) {
      matched = false;
    }
    
    // Check function requirement
    if (conditions.requiresFunctions !== undefined && conditions.requiresFunctions !== requirements.needsFunctionCalling) {
      matched = false;
    }
    
    return {
      rule,
      matched,
      score,
      actions: rule.actions,
    };
  }
  
  applyProviderPreferences(
    providers: LLMProvider[],
    preferences: ProviderPreference[],
    task: GenerationTask,
    complexity: TaskComplexity
  ): LLMProvider[] {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Filter and score providers based on preferences
    const scoredProviders = providers.map(provider => {
      const preference = preferences.find(p => p.name === provider.name);
      let score = preference?.priority || 50;
      
      if (!preference || !preference.enabled) {
        score = 0;
      } else if (preference.conditions) {
        // Check task type conditions
        if (preference.conditions.taskTypes && 
            !preference.conditions.taskTypes.includes(task.requirements?.taskType || 'chat')) {
          score *= 0.5;
        }
        
        // Check complexity range
        if (preference.conditions.complexityRange) {
          const { min, max } = preference.conditions.complexityRange;
          if (complexity.score < min || complexity.score > max) {
            score *= 0.5;
          }
        }
        
        // Check time of day
        if (preference.conditions.timeOfDay) {
          const { start, end } = preference.conditions.timeOfDay;
          if (!this.isTimeInRange(currentTime, start, end)) {
            score *= 0.7;
          }
        }
      }
      
      return { provider, score };
    });
    
    // Sort by score and filter out disabled providers
    return scoredProviders
      .filter(sp => sp.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(sp => sp.provider);
  }
  
  private isTimeInRange(current: string, start: string, end: string): boolean {
    const [currentHour, currentMin] = current.split(':').map(Number);
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const currentMinutes = currentHour * 60 + currentMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes <= endMinutes) {
      // Normal range (e.g., 09:00 - 17:00)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range (e.g., 22:00 - 06:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }
  
  enforcePrivacySettings(
    providers: LLMProvider[],
    privacyMode: 'strict' | 'balanced' | 'permissive',
    excludeProviders?: string[]
  ): LLMProvider[] {
    let filtered = [...providers];
    
    // Apply privacy mode
    switch (privacyMode) {
      case 'strict':
        // Only local providers in strict mode
        filtered = filtered.filter(p => p.type === 'local');
        break;
      case 'balanced':
        // Prefer local but allow cloud
        filtered.sort((a, b) => {
          if (a.type === 'local' && b.type !== 'local') return -1;
          if (a.type !== 'local' && b.type === 'local') return 1;
          return 0;
        });
        break;
      case 'permissive':
        // No restrictions
        break;
    }
    
    // Exclude specific providers
    if (excludeProviders && excludeProviders.length > 0) {
      filtered = filtered.filter(p => !excludeProviders.includes(p.name));
    }
    
    return filtered;
  }
  
  validateConfiguration(
    task: GenerationTask,
    selectedProvider: LLMProvider,
    costEstimate: number,
    performanceEstimate: number,
    config: {
      maxCostPerRequest?: number;
      maxLatency?: number;
      requiredProviderType?: 'local' | 'cloud';
    }
  ): { valid: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let valid = true;
    
    // Check cost constraint
    if (config.maxCostPerRequest && costEstimate > config.maxCostPerRequest) {
      valid = false;
      reasons.push(`Cost estimate ($${costEstimate}) exceeds limit ($${config.maxCostPerRequest})`);
    }
    
    // Check latency constraint
    if (config.maxLatency && performanceEstimate > config.maxLatency) {
      valid = false;
      reasons.push(`Latency estimate (${performanceEstimate}ms) exceeds limit (${config.maxLatency}ms)`);
    }
    
    // Check provider type constraint
    if (config.requiredProviderType && selectedProvider.type !== config.requiredProviderType) {
      valid = false;
      reasons.push(`Provider type (${selectedProvider.type}) doesn't match requirement (${config.requiredProviderType})`);
    }
    
    return { valid, reasons };
  }
}