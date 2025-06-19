export interface OllamaConfig {
  host: string;
  defaultModel: string;
  timeout: number;
  maxRetries?: number;
  retryDelay?: number;
}