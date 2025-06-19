import OpenAI from 'openai';
import { LocalLLMService } from '../base/LocalLLMService';
import { 
  ModelInfo, 
  GenerationOptions, 
  HealthStatus,
  ModelCapabilities,
  Message 
} from '../../../models/types';
import { logger } from '../../../utils/logger';
import { LocalAIConfig } from './LocalAIConfig';

export class LocalAIService extends LocalLLMService {
  public name = 'LocalAI';
  public modelInfo: ModelInfo;
  
  private client: OpenAI;
  private config: LocalAIConfig;
  private currentModelId: string | null = null;
  private availableModels: Map<string, ModelInfo> = new Map();
  
  constructor(config?: LocalAIConfig) {
    super();
    this.config = {
      baseUrl: config?.baseUrl || 'http://localhost',
      port: config?.port || 8080,
      apiKey: config?.apiKey || 'sk-localai-dummy',
      defaultModel: config?.defaultModel || 'llama3',
      timeout: config?.timeout || 30000,
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000,
      endpoints: {
        chat: '/v1/chat/completions',
        completions: '/v1/completions',
        embeddings: '/v1/embeddings',
        images: '/v1/images/generations',
        audio: '/v1/audio',
        tts: '/v1/audio/speech',
        stt: '/v1/audio/transcriptions',
        ...config?.endpoints
      },
      performance: {
        threads: 8,
        batchSize: 512,
        contextSize: 4096,
        gpuLayers: 35,
        f16: true,
        ...config?.performance
      },
      ...config
    };
    
    // Initialize OpenAI client with LocalAI endpoint
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: `${this.config.baseUrl}:${this.config.port}/v1`,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
    
    this.modelInfo = {
      id: this.config.defaultModel || 'unknown',
      name: 'LocalAI Model',
      provider: 'LocalAI',
      size: 'Unknown',
      capabilities: {
        contextWindow: this.config.performance?.contextSize || 4096,
        maxOutputTokens: 4096,
        supportsFunctions: true,
        supportsVision: true,
        supportsStreaming: true
      }
    };
  }
  
  async initialize(): Promise<void> {
    logger.info(`Initializing LocalAI service at ${this.config.baseUrl}:${this.config.port}`);
    
    try {
      await this.checkHealth();
      await this.loadAvailableModels();
      
      if (this.config.defaultModel) {
        await this.loadModel(this.config.defaultModel);
      }
      
      logger.info('LocalAI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize LocalAI service:', error);
      throw error;
    }
  }
  
  async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.config.baseUrl}:${this.config.port}/readyz`);
      const healthy = response.ok;
      
      return {
        healthy,
        latency: 0,
        message: healthy ? 'LocalAI is running' : 'LocalAI is not responding'
      };
    } catch (error) {
      return {
        healthy: false,
        latency: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async generateText(prompt: string, options: GenerationOptions = {}): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.currentModelId || this.config.defaultModel || 'llama3',
        messages: [
          ...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
          { role: 'user' as const, content: prompt }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
        top_p: options.topP ?? 0.9,
        stop: options.stopSequences,
        stream: false,
      });
      
      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('LocalAI text generation failed:', error);
      throw new Error(`LocalAI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async *generateStream(prompt: string, options: GenerationOptions = {}): AsyncGenerator<string> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.currentModelId || this.config.defaultModel || 'llama3',
        messages: [
          ...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
          { role: 'user' as const, content: prompt }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
        top_p: options.topP ?? 0.9,
        stop: options.stopSequences,
        stream: true,
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      logger.error('LocalAI stream generation failed:', error);
      throw new Error(`LocalAI stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async chat(messages: Message[], options: GenerationOptions = {}): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.currentModelId || this.config.defaultModel || 'llama3',
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
        top_p: options.topP ?? 0.9,
        stop: options.stopSequences,
        stream: false,
      });
      
      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('LocalAI chat failed:', error);
      throw new Error(`LocalAI chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.client.models.list();
      const models: ModelInfo[] = [];
      
      for await (const model of response) {
        const modelInfo: ModelInfo = {
          id: model.id,
          name: model.id,
          provider: 'LocalAI',
          size: 'Unknown',
          capabilities: this.getModelCapabilities(model.id)
        };
        models.push(modelInfo);
        this.availableModels.set(model.id, modelInfo);
      }
      
      return models;
    } catch (error) {
      logger.error('Failed to list LocalAI models:', error);
      return [];
    }
  }
  
  async loadModel(modelId: string): Promise<void> {
    try {
      // LocalAI doesn't require explicit model loading
      // Models are loaded on-demand during inference
      this.currentModelId = modelId;
      
      const modelInfo = this.availableModels.get(modelId);
      if (modelInfo) {
        this.modelInfo = modelInfo;
      } else {
        this.modelInfo.id = modelId;
        this.modelInfo.name = modelId;
      }
      
      logger.info(`Loaded LocalAI model: ${modelId}`);
    } catch (error) {
      logger.error(`Failed to load LocalAI model ${modelId}:`, error);
      throw error;
    }
  }
  
  async unloadModel(): Promise<void> {
    // LocalAI manages model memory automatically
    this.currentModelId = null;
    logger.info('Unloaded LocalAI model');
  }
  
  async getModelInfo(): Promise<ModelInfo> {
    return this.modelInfo;
  }
  
  private async loadAvailableModels(): Promise<void> {
    try {
      await this.listModels();
    } catch (error) {
      logger.warn('Could not load available models:', error);
    }
  }
  
  private getModelCapabilities(modelId: string): ModelCapabilities {
    // Detect capabilities based on model name
    const isVisionModel = modelId.toLowerCase().includes('vision') || 
                         modelId.toLowerCase().includes('llava') ||
                         modelId.toLowerCase().includes('bakllava');
    
    const isCodeModel = modelId.toLowerCase().includes('code') ||
                       modelId.toLowerCase().includes('deepseek-coder') ||
                       modelId.toLowerCase().includes('codellama');
    
    return {
      contextWindow: this.config.performance?.contextSize || 4096,
      maxOutputTokens: 4096,
      supportsFunctions: true,
      supportsVision: isVisionModel,
      supportsStreaming: true
    };
  }
  
  // Multi-modal specific methods
  
  async generateImage(prompt: string, options?: {
    model?: string;
    n?: number;
    size?: string;
    quality?: string;
  }): Promise<string[]> {
    try {
      const response = await this.client.images.generate({
        prompt,
        model: options?.model || 'stablediffusion',
        n: options?.n || 1,
        size: options?.size as any || '512x512',
      });
      
      return response.data.map(img => img.url || '');
    } catch (error) {
      logger.error('LocalAI image generation failed:', error);
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async generateSpeech(text: string, options?: {
    model?: string;
    voice?: string;
    speed?: number;
  }): Promise<Buffer> {
    try {
      const response = await fetch(`${this.config.baseUrl}:${this.config.port}${this.config.endpoints?.tts}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options?.model || 'tts-1',
          input: text,
          voice: options?.voice || 'alloy',
          speed: options?.speed || 1.0,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error('LocalAI TTS failed:', error);
      throw new Error(`TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async transcribeAudio(audioBuffer: Buffer, options?: {
    model?: string;
    language?: string;
  }): Promise<string> {
    try {
      // LocalAI expects multipart form data for audio
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      formData.append('file', blob, 'audio.wav');
      formData.append('model', options?.model || 'whisper-1');
      if (options?.language) {
        formData.append('language', options.language);
      }
      
      const response = await fetch(`${this.config.baseUrl}:${this.config.port}${this.config.endpoints?.stt}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`STT request failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.text || '';
    } catch (error) {
      logger.error('LocalAI STT failed:', error);
      throw new Error(`STT failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async generateEmbeddings(texts: string[], options?: {
    model?: string;
  }): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({
        model: options?.model || 'text-embedding-ada-002',
        input: texts,
      });
      
      return response.data.map(embedding => embedding.embedding);
    } catch (error) {
      logger.error('LocalAI embeddings generation failed:', error);
      throw new Error(`Embeddings failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}