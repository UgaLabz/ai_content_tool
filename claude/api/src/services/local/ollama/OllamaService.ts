import { Ollama } from 'ollama';
import { LocalLLMService } from '../base/LocalLLMService';
import { 
  ModelInfo, 
  GenerationOptions, 
  HealthStatus,
  ModelCapabilities 
} from '../../../models/types';
import { logger } from '../../../utils/logger';
import { OllamaConfig } from './OllamaConfig';

export class OllamaService extends LocalLLMService {
  public name = 'Ollama';
  public modelInfo: ModelInfo;
  
  private ollama: Ollama;
  private config: OllamaConfig;
  
  constructor(config?: Partial<OllamaConfig>) {
    super();
    this.config = {
      host: config?.host || process.env.OLLAMA_HOST || 'http://localhost:11434',
      defaultModel: config?.defaultModel || 'llama3.1:8b',
      timeout: config?.timeout || 30000,
      ...config
    };
    
    this.ollama = new Ollama({ host: this.config.host });
    
    this.modelInfo = {
      id: this.config.defaultModel,
      name: 'Ollama Model',
      provider: 'Ollama',
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
      const health = await this.checkHealth();
      if (!health.healthy) {
        throw new Error(`Ollama service is not healthy: ${health.error}`);
      }
      
      await this.loadModel(this.config.defaultModel);
      this.isInitialized = true;
      logger.info({ model: this.config.defaultModel }, 'Ollama service initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Ollama service');
      throw error;
    }
  }
  
  async generateText(prompt: string, options: GenerationOptions): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const validatedOptions = this.validateOptions(options);
    
    try {
      const response = await this.ollama.generate({
        model: this.currentModelId || this.config.defaultModel,
        prompt: validatedOptions.systemPrompt 
          ? `${validatedOptions.systemPrompt}\n\n${prompt}` 
          : prompt,
        options: {
          temperature: validatedOptions.temperature,
          num_predict: validatedOptions.maxTokens,
          top_p: validatedOptions.topP,
          top_k: validatedOptions.topK,
          stop: validatedOptions.stopSequences
        },
        stream: false
      });
      
      return response.response;
    } catch (error) {
      logger.error({ error, model: this.currentModelId }, 'Ollama generation failed');
      throw error;
    }
  }
  
  async *generateStream(prompt: string, options: GenerationOptions): AsyncGenerator<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const validatedOptions = this.validateOptions(options);
    
    try {
      const response = await this.ollama.generate({
        model: this.currentModelId || this.config.defaultModel,
        prompt: validatedOptions.systemPrompt 
          ? `${validatedOptions.systemPrompt}\n\n${prompt}` 
          : prompt,
        options: {
          temperature: validatedOptions.temperature,
          num_predict: validatedOptions.maxTokens,
          top_p: validatedOptions.topP,
          top_k: validatedOptions.topK,
          stop: validatedOptions.stopSequences
        },
        stream: true
      });
      
      for await (const chunk of response) {
        yield chunk.response;
      }
    } catch (error) {
      logger.error({ error, model: this.currentModelId }, 'Ollama streaming failed');
      throw error;
    }
  }
  
  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const models = await this.ollama.list();
      const latency = Date.now() - startTime;
      
      return {
        healthy: true,
        latency,
        modelLoaded: models.models.some(m => m.name === this.currentModelId)
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.ollama.list();
      
      return response.models.map(model => ({
        id: model.name,
        name: model.name,
        provider: 'Ollama',
        size: this.formatSize(model.size),
        quantization: this.extractQuantization(model.name),
        capabilities: this.getModelCapabilities(model.name)
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to list Ollama models');
      throw error;
    }
  }
  
  async loadModel(modelId: string): Promise<void> {
    try {
      logger.info({ modelId }, 'Loading Ollama model');
      
      const response = await this.ollama.show({ 
        model: modelId,
        system: ''
      });
      
      this.currentModelId = modelId;
      this.modelInfo = {
        id: modelId,
        name: modelId,
        provider: 'Ollama',
        size: this.extractModelSize(modelId),
        quantization: this.extractQuantization(modelId),
        capabilities: this.getModelCapabilities(modelId)
      };
      
      logger.info({ modelId }, 'Ollama model loaded successfully');
    } catch (error) {
      logger.error({ error, modelId }, 'Failed to load Ollama model');
      throw error;
    }
  }
  
  async unloadModel(): Promise<void> {
    this.currentModelId = undefined;
    logger.info('Ollama model unloaded');
  }
  
  async pullModel(modelId: string, onProgress?: (progress: number) => void): Promise<void> {
    try {
      logger.info({ modelId }, 'Pulling Ollama model');
      
      const stream = await this.ollama.pull({ 
        model: modelId,
        stream: true 
      });
      
      for await (const progress of stream) {
        if (progress.total && progress.completed) {
          const percent = (progress.completed / progress.total) * 100;
          onProgress?.(percent);
          logger.info({ modelId, percent: percent.toFixed(2) }, 'Pull progress');
        }
      }
      
      logger.info({ modelId }, 'Ollama model pulled successfully');
    } catch (error) {
      logger.error({ error, modelId }, 'Failed to pull Ollama model');
      throw error;
    }
  }
  
  async deleteModel(modelId: string): Promise<void> {
    try {
      await this.ollama.delete({ model: modelId });
      logger.info({ modelId }, 'Ollama model deleted');
    } catch (error) {
      logger.error({ error, modelId }, 'Failed to delete Ollama model');
      throw error;
    }
  }
  
  private formatSize(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)}GB`;
  }
  
  private extractQuantization(modelName: string): string | undefined {
    const quantPattern = /:(Q\d+_K_[MSL]|Q\d+_K|Q\d+)/i;
    const match = modelName.match(quantPattern);
    return match ? match[1] : undefined;
  }
  
  private extractModelSize(modelName: string): string {
    const sizePattern = /(\d+\.?\d*)[bB]/;
    const match = modelName.match(sizePattern);
    return match ? `${match[1]}B` : 'Unknown';
  }
  
  private getModelCapabilities(modelName: string): ModelCapabilities {
    const lowerName = modelName.toLowerCase();
    
    let contextWindow = 4096;
    if (lowerName.includes('llama3.1')) contextWindow = 128000;
    else if (lowerName.includes('llama3')) contextWindow = 8192;
    else if (lowerName.includes('mixtral')) contextWindow = 32768;
    else if (lowerName.includes('gemma2')) contextWindow = 8192;
    
    const supportsVision = lowerName.includes('llava') || 
                          lowerName.includes('bakllava') ||
                          lowerName.includes('vision');
    
    return {
      contextWindow,
      maxOutputTokens: Math.min(4096, contextWindow),
      supportsFunctions: false,
      supportsVision,
      supportsStreaming: true
    };
  }
}