import { GenerationTask } from '../../../models/types';
import { logger } from '../../../utils/logger';

export interface TaskComplexity {
  score: number; // 1-10 scale
  factors: {
    tokenCount: number;
    contextDepth: number;
    reasoning: boolean;
    creativity: boolean;
    multiStep: boolean;
    domainSpecific: boolean;
    codeGeneration: boolean;
    multiModal: boolean;
  };
  recommendedModelSize: 'small' | 'medium' | 'large' | 'xlarge';
}

export interface TaskRequirements {
  minContextWindow: number;
  needsFunctionCalling: boolean;
  needsVision: boolean;
  needsStreaming: boolean;
  estimatedTokens: number;
  taskType: 'chat' | 'completion' | 'code' | 'creative' | 'analysis' | 'translation' | 'summarization';
}

export class TaskAnalyzer {
  private readonly patterns = {
    code: /(?:write|create|implement|code|function|class|debug|fix|refactor)/i,
    creative: /(?:story|poem|creative|imagine|describe|narrative|fiction)/i,
    analysis: /(?:analyze|explain|compare|evaluate|assess|review)/i,
    reasoning: /(?:why|how|because|therefore|solve|calculate|prove)/i,
    multiStep: /(?:first|then|next|finally|step\s+\d|procedure)/i,
    translation: /(?:translate|convert|from\s+\w+\s+to\s+\w+)/i,
    summarization: /(?:summarize|summary|brief|concise|main\s+points)/i,
    vision: /(?:image|picture|photo|visual|see|look|describe\s+this)/i,
    function: /(?:tool|function|api|call|execute|run)/i,
  };
  
  analyzeComplexity(task: GenerationTask): TaskComplexity {
    const prompt = task.prompt + (task.options?.systemPrompt || '');
    const tokenCount = this.estimateTokens(prompt);
    
    const factors = {
      tokenCount,
      contextDepth: this.calculateContextDepth(task),
      reasoning: this.patterns.reasoning.test(prompt),
      creativity: this.patterns.creative.test(prompt),
      multiStep: this.patterns.multiStep.test(prompt),
      domainSpecific: this.isDomainSpecific(prompt),
      codeGeneration: this.patterns.code.test(prompt),
      multiModal: this.patterns.vision.test(prompt) || task.requirements?.multiModal || false,
    };
    
    // Calculate complexity score
    let score = 1;
    
    // Token count factor
    if (tokenCount > 2000) score += 3;
    else if (tokenCount > 1000) score += 2;
    else if (tokenCount > 500) score += 1;
    
    // Context depth factor
    score += Math.min(factors.contextDepth, 3);
    
    // Task type factors
    if (factors.reasoning) score += 2;
    if (factors.creativity) score += 1;
    if (factors.multiStep) score += 2;
    if (factors.domainSpecific) score += 2;
    if (factors.codeGeneration) score += 2;
    if (factors.multiModal) score += 3;
    
    // Normalize to 1-10 scale
    score = Math.min(Math.max(score, 1), 10);
    
    // Determine recommended model size
    let recommendedModelSize: 'small' | 'medium' | 'large' | 'xlarge';
    if (score <= 3) recommendedModelSize = 'small';
    else if (score <= 5) recommendedModelSize = 'medium';
    else if (score <= 8) recommendedModelSize = 'large';
    else recommendedModelSize = 'xlarge';
    
    logger.debug({ score, factors, recommendedModelSize }, 'Task complexity analyzed');
    
    return { score, factors, recommendedModelSize };
  }
  
  analyzeRequirements(task: GenerationTask): TaskRequirements {
    const prompt = task.prompt + (task.options?.systemPrompt || '');
    const estimatedTokens = this.estimateTokens(prompt) + (task.options?.maxTokens || 1024);
    
    // Determine task type
    let taskType: TaskRequirements['taskType'] = 'chat';
    if (this.patterns.code.test(prompt)) taskType = 'code';
    else if (this.patterns.creative.test(prompt)) taskType = 'creative';
    else if (this.patterns.analysis.test(prompt)) taskType = 'analysis';
    else if (this.patterns.translation.test(prompt)) taskType = 'translation';
    else if (this.patterns.summarization.test(prompt)) taskType = 'summarization';
    else if (task.options?.systemPrompt) taskType = 'completion';
    
    // Calculate minimum context window needed
    const minContextWindow = Math.max(
      estimatedTokens * 1.5, // 50% buffer
      4096 // minimum
    );
    
    const requirements: TaskRequirements = {
      minContextWindow,
      needsFunctionCalling: this.patterns.function.test(prompt) || task.requirements?.functionCalling || false,
      needsVision: this.patterns.vision.test(prompt) || task.requirements?.vision || false,
      needsStreaming: task.requirements?.streaming ?? true,
      estimatedTokens,
      taskType,
    };
    
    logger.debug({ requirements }, 'Task requirements analyzed');
    
    return requirements;
  }
  
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
  
  private calculateContextDepth(task: GenerationTask): number {
    let depth = 0;
    
    // Check for conversation history
    if (task.context?.conversationHistory) {
      depth += Math.min(task.context.conversationHistory.length / 2, 3);
    }
    
    // Check for system prompt complexity
    if (task.options?.systemPrompt) {
      const systemTokens = this.estimateTokens(task.options.systemPrompt);
      if (systemTokens > 500) depth += 2;
      else if (systemTokens > 200) depth += 1;
    }
    
    // Check for multi-turn indicators
    if (task.context?.sessionId) depth += 1;
    
    return Math.min(depth, 5);
  }
  
  private isDomainSpecific(prompt: string): boolean {
    const domainKeywords = [
      /(?:medical|diagnosis|symptom|treatment|patient)/i,
      /(?:legal|law|contract|regulation|compliance)/i,
      /(?:financial|investment|trading|portfolio|market)/i,
      /(?:scientific|research|hypothesis|experiment|data)/i,
      /(?:technical|engineering|architecture|infrastructure)/i,
    ];
    
    return domainKeywords.some(pattern => pattern.test(prompt));
  }
  
  // Utility method to check if a task matches provider capabilities
  matchesCapabilities(
    requirements: TaskRequirements,
    capabilities: {
      contextWindow: number;
      supportsFunctions: boolean;
      supportsVision: boolean;
      supportsStreaming: boolean;
    }
  ): boolean {
    if (requirements.minContextWindow > capabilities.contextWindow) return false;
    if (requirements.needsFunctionCalling && !capabilities.supportsFunctions) return false;
    if (requirements.needsVision && !capabilities.supportsVision) return false;
    if (requirements.needsStreaming && !capabilities.supportsStreaming) return false;
    
    return true;
  }
}