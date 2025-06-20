import { logger } from '../../utils/logger';
import { PromptCache } from '../cache/CacheService';

export interface OptimizationOptions {
  maxTokens?: number;
  preserveContext?: boolean;
  compressionLevel?: 'light' | 'moderate' | 'aggressive';
  cacheResults?: boolean;
}

export interface OptimizationResult {
  original: string;
  optimized: string;
  tokenReduction: number;
  compressionRatio: number;
  techniques: string[];
}

export class PromptOptimizer {
  private cache: PromptCache;
  private tokenizer: any; // Would use actual tokenizer in production
  
  constructor() {
    this.cache = new PromptCache();
  }
  
  /**
   * Optimize a prompt for token efficiency
   */
  async optimize(
    prompt: string,
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult> {
    const cacheKey = this.cache.generateKey(prompt, options);
    
    // Check cache
    if (options.cacheResults !== false) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    
    const original = prompt;
    let optimized = prompt;
    const techniques: string[] = [];
    
    // Apply optimization techniques based on compression level
    const level = options.compressionLevel || 'moderate';
    
    if (level !== 'light') {
      optimized = this.removeRedundantWhitespace(optimized);
      techniques.push('whitespace_removal');
    }
    
    if (level !== 'light') {
      optimized = this.simplifyPunctuation(optimized);
      techniques.push('punctuation_simplification');
    }
    
    optimized = this.removeRedundantPhrases(optimized);
    techniques.push('redundancy_removal');
    
    if (level === 'aggressive') {
      optimized = this.abbreviateCommonPhrases(optimized);
      techniques.push('phrase_abbreviation');
      
      optimized = this.removeFillerWords(optimized);
      techniques.push('filler_removal');
    }
    
    // Context preservation
    if (!options.preserveContext) {
      optimized = this.removeNonEssentialContext(optimized);
      techniques.push('context_trimming');
    }
    
    // Token limit enforcement
    if (options.maxTokens) {
      optimized = await this.enforceTokenLimit(optimized, options.maxTokens);
      techniques.push('token_truncation');
    }
    
    // Calculate metrics
    const originalTokens = this.estimateTokens(original);
    const optimizedTokens = this.estimateTokens(optimized);
    const tokenReduction = originalTokens - optimizedTokens;
    const compressionRatio = 1 - (optimizedTokens / originalTokens);
    
    const result: OptimizationResult = {
      original,
      optimized,
      tokenReduction,
      compressionRatio,
      techniques,
    };
    
    // Cache result
    if (options.cacheResults !== false) {
      await this.cache.set(cacheKey, JSON.stringify(result), 3600000); // 1 hour
    }
    
    logger.debug({
      originalTokens,
      optimizedTokens,
      tokenReduction,
      compressionRatio: `${(compressionRatio * 100).toFixed(1)}%`,
      techniques,
    }, 'Prompt optimized');
    
    return result;
  }
  
  /**
   * Optimize multiple prompts in batch
   */
  async optimizeBatch(
    prompts: string[],
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult[]> {
    return Promise.all(prompts.map(prompt => this.optimize(prompt, options)));
  }
  
  /**
   * Remove redundant whitespace
   */
  private removeRedundantWhitespace(text: string): string {
    return text
      .replace(/\s+/g, ' ')           // Multiple spaces to single
      .replace(/\n\s*\n/g, '\n')      // Multiple newlines to single
      .replace(/^\s+|\s+$/gm, '')     // Trim lines
      .trim();
  }
  
  /**
   * Simplify punctuation
   */
  private simplifyPunctuation(text: string): string {
    return text
      .replace(/\.\.\./g, '…')        // Ellipsis
      .replace(/\s*-\s*/g, '-')       // Spaces around hyphens
      .replace(/\s*:\s*/g, ':')       // Spaces around colons
      .replace(/\s*;\s*/g, ';')       // Spaces around semicolons
      .replace(/\s*,\s*/g, ', ')      // Normalize comma spacing
      .replace(/([.!?])\s*\1+/g, '$1'); // Remove repeated punctuation
  }
  
  /**
   * Remove redundant phrases
   */
  private removeRedundantPhrases(text: string): string {
    const redundantPhrases = [
      /\b(basically|essentially|fundamentally)\s+/gi,
      /\b(in order to)\b/gi,
      /\b(the fact that)\b/gi,
      /\b(it is important to note that)\b/gi,
      /\b(it should be noted that)\b/gi,
      /\b(at this point in time)\b/gi,
      /\b(in the event that)\b/gi,
    ];
    
    let result = text;
    for (const phrase of redundantPhrases) {
      result = result.replace(phrase, '');
    }
    
    return result;
  }
  
  /**
   * Abbreviate common phrases
   */
  private abbreviateCommonPhrases(text: string): string {
    const abbreviations = new Map([
      ['for example', 'e.g.'],
      ['that is', 'i.e.'],
      ['et cetera', 'etc.'],
      ['versus', 'vs.'],
      ['because', 'b/c'],
      ['with respect to', 'w.r.t.'],
      ['as soon as possible', 'ASAP'],
    ]);
    
    let result = text;
    for (const [full, abbr] of abbreviations) {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      result = result.replace(regex, abbr);
    }
    
    return result;
  }
  
  /**
   * Remove filler words
   */
  private removeFillerWords(text: string): string {
    const fillers = [
      /\b(just|really|very|quite|rather|somewhat|fairly)\s+/gi,
      /\b(actually|basically|literally|seriously)\s+/gi,
      /\b(kind of|sort of|type of thing)\b/gi,
    ];
    
    let result = text;
    for (const filler of fillers) {
      result = result.replace(filler, ' ');
    }
    
    return result.replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Remove non-essential context
   */
  private removeNonEssentialContext(text: string): string {
    // Remove meta-instructions that might be redundant
    const patterns = [
      /^(Please |Kindly |Could you )/i,
      /(Thank you|Thanks|Please let me know if you need anything else)\.?$/i,
      /\b(by the way|incidentally|on a related note)\b[^.]*\./gi,
    ];
    
    let result = text;
    for (const pattern of patterns) {
      result = result.replace(pattern, '');
    }
    
    return result.trim();
  }
  
  /**
   * Enforce token limit by intelligent truncation
   */
  private async enforceTokenLimit(
    text: string,
    maxTokens: number
  ): Promise<string> {
    const tokens = this.estimateTokens(text);
    
    if (tokens <= maxTokens) {
      return text;
    }
    
    // Intelligent truncation - try to preserve complete sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let result = '';
    let currentTokens = 0;
    
    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence);
      if (currentTokens + sentenceTokens > maxTokens) {
        break;
      }
      result += sentence;
      currentTokens += sentenceTokens;
    }
    
    // If no complete sentences fit, do hard truncation
    if (result === '') {
      const charLimit = Math.floor(maxTokens * 3); // Rough estimate
      result = text.substring(0, charLimit) + '…';
    }
    
    return result.trim();
  }
  
  /**
   * Estimate token count (simplified - use proper tokenizer in production)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters or 0.75 words
    const charCount = text.length;
    const wordCount = text.split(/\s+/).length;
    
    return Math.ceil(Math.max(charCount / 4, wordCount * 0.75));
  }
}

// Specialized prompt optimizers

export class SystemPromptOptimizer extends PromptOptimizer {
  /**
   * Optimize system prompts by removing redundant instructions
   */
  async optimizeSystemPrompt(
    systemPrompt: string,
    modelType: string
  ): Promise<string> {
    const result = await this.optimize(systemPrompt, {
      compressionLevel: 'moderate',
      preserveContext: true,
    });
    
    // Model-specific optimizations
    let optimized = result.optimized;
    
    if (modelType.includes('llama')) {
      // Llama models understand concise instructions well
      optimized = optimized.replace(/You must/gi, 'Must');
      optimized = optimized.replace(/You should/gi, 'Should');
    }
    
    if (modelType.includes('gpt')) {
      // GPT models can handle bullet points efficiently
      optimized = this.convertToBulletPoints(optimized);
    }
    
    return optimized;
  }
  
  private convertToBulletPoints(text: string): string {
    // Convert numbered lists to bullet points (more token efficient)
    return text.replace(/^\d+\.\s*/gm, '• ');
  }
}

export class ConversationOptimizer extends PromptOptimizer {
  /**
   * Optimize conversation history for context window
   */
  async optimizeConversation(
    messages: Array<{ role: string; content: string }>,
    maxTokens: number
  ): Promise<Array<{ role: string; content: string }>> {
    let totalTokens = 0;
    const optimizedMessages: Array<{ role: string; content: string }> = [];
    
    // Keep most recent messages, optimize older ones more aggressively
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = this.estimateTokens(message.content);
      
      if (totalTokens + messageTokens > maxTokens) {
        break;
      }
      
      // More aggressive optimization for older messages
      const compressionLevel = i < messages.length / 2 ? 'aggressive' : 'light';
      
      const result = await this.optimize(message.content, {
        compressionLevel,
        preserveContext: message.role === 'system',
      });
      
      optimizedMessages.unshift({
        role: message.role,
        content: result.optimized,
      });
      
      totalTokens += this.estimateTokens(result.optimized);
    }
    
    return optimizedMessages;
  }
}