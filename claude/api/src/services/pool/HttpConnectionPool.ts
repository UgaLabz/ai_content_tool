import { ConnectionPool, PoolConfig } from './ConnectionPool';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { logger } from '../../utils/logger';

export interface HttpPoolConfig extends PoolConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  maxRedirects?: number;
  keepAlive?: boolean;
  keepAliveMsecs?: number;
  maxSockets?: number;
  maxFreeSockets?: number;
  socketTimeout?: number;
}

export class HttpConnectionPool extends ConnectionPool<AxiosInstance> {
  private httpAgent: HttpAgent;
  private httpsAgent: HttpsAgent;
  private baseConfig: AxiosRequestConfig;
  
  constructor(config: HttpPoolConfig) {
    super(config);
    
    // Configure HTTP agents for connection pooling
    this.httpAgent = new HttpAgent({
      keepAlive: config.keepAlive !== false,
      keepAliveMsecs: config.keepAliveMsecs || 1000,
      maxSockets: config.maxSockets || config.max,
      maxFreeSockets: config.maxFreeSockets || Math.floor(config.max / 2),
      timeout: config.socketTimeout || 60000,
    });
    
    this.httpsAgent = new HttpsAgent({
      keepAlive: config.keepAlive !== false,
      keepAliveMsecs: config.keepAliveMsecs || 1000,
      maxSockets: config.maxSockets || config.max,
      maxFreeSockets: config.maxFreeSockets || Math.floor(config.max / 2),
      timeout: config.socketTimeout || 60000,
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    });
    
    this.baseConfig = {
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: config.headers || {},
      maxRedirects: config.maxRedirects || 5,
      httpAgent: this.httpAgent,
      httpsAgent: this.httpsAgent,
    };
  }
  
  protected async createResource(): Promise<AxiosInstance> {
    const instance = axios.create(this.baseConfig);
    
    // Add request interceptor for logging
    instance.interceptors.request.use(
      (config) => {
        logger.debug({
          method: config.method,
          url: config.url,
          headers: config.headers,
        }, 'HTTP request');
        return config;
      },
      (error) => {
        logger.error({ error }, 'HTTP request error');
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for logging
    instance.interceptors.response.use(
      (response) => {
        logger.debug({
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        }, 'HTTP response');
        return response;
      },
      (error) => {
        logger.error({
          error: error.message,
          code: error.code,
          status: error.response?.status,
        }, 'HTTP response error');
        return Promise.reject(error);
      }
    );
    
    // Test connection
    try {
      await instance.head('/');
      return instance;
    } catch (error) {
      // Some endpoints might not support HEAD
      logger.debug('HEAD request failed, connection might still be valid');
      return instance;
    }
  }
  
  protected async destroyResource(resource: AxiosInstance): Promise<void> {
    // Axios instances don't need explicit cleanup
    // The underlying agents will handle connection cleanup
  }
  
  protected async validateConnection(resource: AxiosInstance): Promise<boolean> {
    try {
      // Simple health check - adjust based on your API
      const response = await resource.head('/', { 
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });
      return response.status < 400;
    } catch (error) {
      logger.debug({ error }, 'Connection validation failed');
      return false;
    }
  }
  
  /**
   * Execute HTTP request with automatic retries
   */
  async request<T = any>(
    config: AxiosRequestConfig,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const client = await this.acquire();
      
      try {
        const response = await client.request<T>(config);
        await this.release(client);
        return response.data;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          await this.release(client);
          throw error;
        }
        
        // Connection might be bad, destroy it
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          await this.destroy(client);
        } else {
          await this.release(client);
        }
        
        // Exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }
  
  /**
   * Close the pool and cleanup agents
   */
  async close(): Promise<void> {
    await this.drain();
    this.httpAgent.destroy();
    this.httpsAgent.destroy();
  }
}

// Specialized pools for different services

export class OllamaConnectionPool extends HttpConnectionPool {
  constructor() {
    super({
      baseURL: process.env.OLLAMA_HOST || 'http://localhost:11434',
      min: 2,
      max: 10,
      timeout: 300000, // 5 minutes for long generations
      keepAlive: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export class LocalAIConnectionPool extends HttpConnectionPool {
  constructor() {
    super({
      baseURL: `${process.env.LOCALAI_HOST || 'http://localhost'}:${process.env.LOCALAI_PORT || '8080'}`,
      min: 2,
      max: 10,
      timeout: 300000,
      keepAlive: true,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LOCALAI_API_KEY || 'sk-localai'}`,
      },
    });
  }
}