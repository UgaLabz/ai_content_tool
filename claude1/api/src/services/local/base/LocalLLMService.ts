import { 
  LLMProvider, 
  ModelInfo, 
  GenerationOptions, 
  GenerationResult, 
  HealthStatus,
  Message 
} from '../../../models/types';
import { logger } from '../../../utils/logger';

export abstract class LocalLLMService implements LLMProvider {
  public abstract name: string;
  public type: 'local' | 'cloud' = 'local';
  public abstract modelInfo: ModelInfo;
  
  protected currentModelId?: string;
  protected isInitialized = false;
  
  abstract initialize(): Promise<void>;
  abstract generateText(prompt: string, options: GenerationOptions): Promise<string>;
  abstract generateStream(prompt: string, options: GenerationOptions): AsyncGenerator<string>;
  abstract checkHealth(): Promise<HealthStatus>;
  abstract listModels(): Promise<ModelInfo[]>;
  abstract loadModel(modelId: string): Promise<void>;
  abstract unloadModel(): Promise<void>;
  
  async generateCompletion(messages: Message[], options: GenerationOptions): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      const prompt = this.messagesToPrompt(messages);
      const text = await this.generateText(prompt, options);
      
      const latency = Date.now() - startTime;
      
      return {
        text,
        model: this.currentModelId || 'unknown',
        provider: this.name,
        latency,
        usage: await this.estimateTokenUsage(prompt, text)
      };
    } catch (error) {
      logger.error({ error, provider: this.name }, 'Generation failed');
      throw error;
    }
  }
  
  protected messagesToPrompt(messages: Message[]): string {
    return messages
      .map(msg => {
        switch (msg.role) {
          case 'system':
            return `System: ${msg.content}`;
          case 'user':
            return `User: ${msg.content}`;
          case 'assistant':
            return `Assistant: ${msg.content}`;
          default:
            return msg.content;
        }
      })
      .join('\n\n');
  }
  
  protected async estimateTokenUsage(prompt: string, completion: string) {
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(completion.length / 4);
    
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    };
  }
  
  protected validateOptions(options: GenerationOptions): GenerationOptions {
    return {
      temperature: Math.max(0, Math.min(2, options.temperature || 0.7)),
      maxTokens: Math.max(1, Math.min(4096, options.maxTokens || 1024)),
      topP: Math.max(0, Math.min(1, options.topP || 0.9)),
      topK: options.topK,
      stopSequences: options.stopSequences || [],
      systemPrompt: options.systemPrompt,
      stream: options.stream || false
    };
  }
}