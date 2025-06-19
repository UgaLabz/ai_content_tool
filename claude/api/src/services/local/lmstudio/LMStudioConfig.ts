export interface LMStudioConfig {
  baseUrl?: string;
  port?: number;
  autoStart?: boolean;
  defaultModel?: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}