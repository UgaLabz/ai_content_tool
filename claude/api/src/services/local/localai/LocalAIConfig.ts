export interface LocalAIConfig {
  baseUrl?: string;
  port?: number;
  apiKey?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  
  // Multi-modal endpoints
  endpoints?: {
    chat?: string;
    completions?: string;
    embeddings?: string;
    images?: string;
    audio?: string;
    tts?: string;
    stt?: string;
  };
  
  // Model configurations
  models?: {
    [key: string]: {
      backend?: string;
      parameters?: Record<string, any>;
      template?: {
        chat?: string;
        completion?: string;
      };
    };
  };
  
  // Performance settings
  performance?: {
    threads?: number;
    batchSize?: number;
    contextSize?: number;
    gpuLayers?: number;
    f16?: boolean;
  };
}