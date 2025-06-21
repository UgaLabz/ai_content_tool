import { exec } from 'child_process';
import { promisify } from 'util';
import { OllamaService } from './OllamaService';
import { GenerationOptions, GenerationResult, HealthStatus, Message } from '../../../models/types';
import { logger } from '../../../utils/logger';

const execAsync = promisify(exec);

export class OllamaSafeWrapper extends OllamaService {
  private maxMemoryUsagePercent = 70; // Lower threshold for safety
  private maxGenerationTime = 30000; // 30 seconds
  private minRequiredMemoryGB = 10; // Minimum free memory required
  
  async initialize(): Promise<void> {
    logger.info('Initializing OllamaSafeWrapper with safety checks');
    
    // Check memory before initializing
    const memCheck = await this.checkMemoryUsage();
    if (memCheck.percentUsed > this.maxMemoryUsagePercent) {
      throw new Error(`Memory usage too high for initialization: ${memCheck.percentUsed}%. Need <${this.maxMemoryUsagePercent}% to safely load models.`);
    }
    
    // Call parent initialization
    await super.initialize();
    
    logger.info('OllamaSafeWrapper initialized successfully');
  }
  
  async loadModel(modelName: string): Promise<void> {
    logger.info(`Checking memory before loading model: ${modelName}`);
    
    // Check memory before loading model
    const memCheck = await this.checkMemoryUsage();
    if (memCheck.percentUsed > this.maxMemoryUsagePercent) {
      throw new Error(`Memory usage too high to load model: ${memCheck.percentUsed}%. Need <${this.maxMemoryUsagePercent}% to safely load models.`);
    }
    
    // Estimate required memory (rough estimate: 5GB for 8B models)
    const requiredGB = modelName.includes('8b') ? 5 : 3;
    if (memCheck.availableGB < requiredGB) {
      throw new Error(`Insufficient memory to load model. Available: ${memCheck.availableGB.toFixed(1)}GB, Required: ~${requiredGB}GB`);
    }
    
    // Call parent loadModel
    await super.loadModel(modelName);
  }
  
  async generateCompletion(messages: Message[], options?: GenerationOptions): Promise<GenerationResult> {
    logger.info('Starting safe Ollama generation');
    
    // Check system resources before generation
    const memCheck = await this.checkMemoryUsage();
    if (memCheck.percentUsed > this.maxMemoryUsagePercent) {
      throw new Error(`Memory usage too high: ${memCheck.percentUsed}%. Aborting generation to prevent system crash.`);
    }
    
    if (memCheck.availableGB < this.minRequiredMemoryGB) {
      throw new Error(`Insufficient free memory: ${memCheck.availableGB.toFixed(1)}GB available, need at least ${this.minRequiredMemoryGB}GB to prevent crashes.`);
    }
    
    // Set a timeout for the generation
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Generation timeout - took too long')), this.maxGenerationTime);
    });
    
    // Set resource limits in options
    const safeOptions: GenerationOptions = {
      ...options,
      maxTokens: Math.min(options?.maxTokens || 500, 500), // Limit to 500 tokens max
      temperature: options?.temperature || 0.7,
    };
    
    try {
      // Race between generation and timeout
      const result = await Promise.race([
        super.generateCompletion(messages, safeOptions),
        timeoutPromise
      ]) as GenerationResult;
      
      // Check memory after generation
      const postMemCheck = await this.checkMemoryUsage();
      if (postMemCheck.percentUsed > 90) {
        logger.warn(`High memory usage after generation: ${postMemCheck.percentUsed}%`);
      }
      
      return result;
    } catch (error) {
      logger.error('Safe generation failed:', error);
      throw error;
    }
  }
  
  private async checkMemoryUsage(): Promise<{ percentUsed: number; availableGB: number }> {
    try {
      const { stdout } = await execAsync("free -m | grep Mem | awk '{print ($2-$7)/$2 * 100, $7/1024}'");
      const [percentUsed, availableGB] = stdout.trim().split(' ').map(Number);
      
      logger.info(`Memory check - Used: ${percentUsed.toFixed(1)}%, Available: ${availableGB.toFixed(1)}GB`);
      
      return { percentUsed, availableGB };
    } catch (error) {
      logger.error('Failed to check memory:', error);
      // Return safe defaults if check fails
      return { percentUsed: 50, availableGB: 4 };
    }
  }
  
  async checkHealth(): Promise<HealthStatus> {
    try {
      // First check if Ollama service is healthy
      const healthStatus = await super.checkHealth();
      if (!healthStatus.healthy) return healthStatus;
      
      // Then check system resources
      const memCheck = await this.checkMemoryUsage();
      if (memCheck.percentUsed > 90) {
        logger.warn('Ollama marked unhealthy due to high memory usage');
        return {
          healthy: false,
          error: `Memory usage too high: ${memCheck.percentUsed.toFixed(1)}%`,
          latency: healthStatus.latency,
          modelLoaded: healthStatus.modelLoaded
        };
      }
      
      return healthStatus;
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}