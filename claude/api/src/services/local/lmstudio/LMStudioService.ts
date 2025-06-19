import { LMStudioClient } from '@lmstudio/sdk';
import { LocalLLMService } from '../base/LocalLLMService';
import { 
  ModelInfo, 
  GenerationOptions, 
  HealthStatus,
  ModelCapabilities,
  Message 
} from '../../../models/types';
import { logger } from '../../../utils/logger';
import { LMStudioConfig } from './LMStudioConfig';

export class LMStudioService extends LocalLLMService {
  public name = 'LMStudio';
  public modelInfo: ModelInfo;
  
  private client: LMStudioClient;
  private config: LMStudioConfig;
  private currentModel: any = null;
  
  constructor(config?: LMStudioConfig) {
    super();
    this.config = {
      baseUrl: config?.baseUrl || 'ws://localhost',
      port: config?.port || 1234,
      autoStart: config?.autoStart ?? true,
      defaultModel: config?.defaultModel,
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000,
      timeout: config?.timeout || 30000,
      ...config
    };
    
    this.client = new LMStudioClient({
      baseUrl: `${this.config.baseUrl}:${this.config.port}`,
    });
    
    this.modelInfo = {
      id: 'unknown',
      name: 'LM Studio Model',
      provider: 'LMStudio',
      size: 'Unknown',
      capabilities: {
        contextWindow: 4096,
        maxOutputTokens: 4096,
        supportsFunctions: false,
        supportsVision: false,
        supportsStreaming: true
      }
    };
  }
  
  async initialize(): Promise<void> {
    try {
      logger.info({ config: this.config }, 'Initializing LM Studio service');
      
      // Try to connect to LM Studio
      const models = await this.listModels();
      
      if (models.length === 0) {
        throw new Error('No models loaded in LM Studio. Please load a model first.');
      }
      
      // Load the default model or the first available
      const modelToLoad = this.config.defaultModel || models[0].id;
      await this.loadModel(modelToLoad);
      
      this.isInitialized = true;
      logger.info({ model: modelToLoad }, 'LM Studio service initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize LM Studio service');
      throw error;
    }
  }
  
  async generateText(prompt: string, options: GenerationOptions): Promise<string> {
    if (!this.isInitialized || !this.currentModel) {
      await this.initialize();
    }
    
    const validatedOptions = this.validateOptions(options);
    
    try {
      const prediction = this.currentModel.respond([
        ...(validatedOptions.systemPrompt 
          ? [{ role: 'system', content: validatedOptions.systemPrompt }] 
          : []),
        { role: 'user', content: prompt }
      ], {
        temperature: validatedOptions.temperature,
        maxTokens: validatedOptions.maxTokens,
        topP: validatedOptions.topP,
        stopStrings: validatedOptions.stopSequences,
        timeout: this.config.timeout
      });
      
      // For non-streaming, collect all chunks
      let fullResponse = '';
      for await (const chunk of prediction) {
        fullResponse += chunk;
      }
      
      return fullResponse;
    } catch (error) {
      logger.error({ error, model: this.currentModelId }, 'LM Studio generation failed');
      throw error;
    }
  }
  
  async *generateStream(prompt: string, options: GenerationOptions): AsyncGenerator<string> {
    if (!this.isInitialized || !this.currentModel) {
      await this.initialize();
    }
    
    const validatedOptions = this.validateOptions(options);
    
    try {
      const prediction = this.currentModel.respond([
        ...(validatedOptions.systemPrompt 
          ? [{ role: 'system', content: validatedOptions.systemPrompt }] 
          : []),
        { role: 'user', content: prompt }
      ], {
        temperature: validatedOptions.temperature,
        maxTokens: validatedOptions.maxTokens,
        topP: validatedOptions.topP,
        stopStrings: validatedOptions.stopSequences,
        timeout: this.config.timeout
      });
      
      for await (const chunk of prediction) {
        yield chunk;
      }
    } catch (error) {
      logger.error({ error, model: this.currentModelId }, 'LM Studio streaming failed');
      throw error;
    }
  }
  
  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const models = await this.client.llm.listDownloadedModels();
      const latency = Date.now() - startTime;
      
      return {
        healthy: true,
        latency,
        modelLoaded: !!this.currentModel
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Cannot connect to LM Studio'
      };
    }
  }
  
  async listModels(): Promise<ModelInfo[]> {
    try {
      const models = await this.client.llm.listDownloadedModels();
      
      return models.map(model => ({
        id: model.id,
        name: model.name || model.id,
        provider: 'LMStudio',
        size: this.extractModelSize(model.id),
        quantization: this.extractQuantization(model.id),
        capabilities: this.getModelCapabilities(model.id)
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to list LM Studio models');
      throw error;
    }
  }
  
  async loadModel(modelId: string): Promise<void> {
    try {
      logger.info({ modelId }, 'Loading LM Studio model');
      
      // Get the model instance
      this.currentModel = await this.client.llm.get({
        model: modelId
      });
      
      this.currentModelId = modelId;
      this.modelInfo = {
        id: modelId,
        name: modelId,
        provider: 'LMStudio',
        size: this.extractModelSize(modelId),
        quantization: this.extractQuantization(modelId),
        capabilities: this.getModelCapabilities(modelId)
      };
      
      logger.info({ modelId }, 'LM Studio model loaded successfully');
    } catch (error) {
      logger.error({ error, modelId }, 'Failed to load LM Studio model');
      throw error;
    }
  }
  
  async unloadModel(): Promise<void> {
    this.currentModel = null;
    this.currentModelId = undefined;
    logger.info('LM Studio model unloaded');
  }
  
  // Additional LM Studio specific methods
  async getLoadedModels(): Promise<string[]> {
    try {
      const models = await this.client.llm.listDownloadedModels();
      return models.map(m => m.id);
    } catch (error) {
      logger.error({ error }, 'Failed to get loaded models');
      return [];
    }
  }
  
  async getModelStats(): Promise<any> {
    if (!this.currentModel) {
      throw new Error('No model loaded');
    }
    
    try {
      // LM Studio SDK might provide stats in future versions
      return {
        modelId: this.currentModelId,
        loaded: true,
        // Add more stats when available in SDK
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get model stats');
      throw error;
    }
  }
  
  private extractQuantization(modelName: string): string | undefined {
    const quantPattern = /[-_](Q\d+_K_[MSL]|Q\d+_K|Q\d+|GGUF|gguf)/i;
    const match = modelName.match(quantPattern);
    return match ? match[1].toUpperCase() : undefined;
  }
  
  private extractModelSize(modelName: string): string {
    const sizePattern = /(\d+\.?\d*)[bB]/;
    const match = modelName.match(sizePattern);
    return match ? `${match[1]}B` : 'Unknown';
  }
  
  private getModelCapabilities(modelName: string): ModelCapabilities {
    const lowerName = modelName.toLowerCase();
    
    let contextWindow = 4096;
    if (lowerName.includes('llama-3') || lowerName.includes('llama3')) {
      contextWindow = lowerName.includes('3.1') ? 128000 : 8192;
    } else if (lowerName.includes('mistral')) {
      contextWindow = 32768;
    } else if (lowerName.includes('yi')) {
      contextWindow = 200000;
    } else if (lowerName.includes('deepseek')) {
      contextWindow = 16384;
    }
    
    const supportsVision = lowerName.includes('llava') || 
                          lowerName.includes('bakllava') ||
                          lowerName.includes('vision');
    
    return {
      contextWindow,
      maxOutputTokens: Math.min(4096, contextWindow),
      supportsFunctions: lowerName.includes('functionary') || lowerName.includes('hermes'),
      supportsVision,
      supportsStreaming: true
    };
  }
}