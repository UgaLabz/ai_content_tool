import axios, { AxiosInstance } from 'axios';
import chalk from 'chalk';

export class APIClient {
  private client: AxiosInstance;
  
  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || process.env.API_URL || 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    
    // Add request/response interceptors for debugging
    if (process.env.DEBUG) {
      this.client.interceptors.request.use(
        (config) => {
          console.log(chalk.gray(`[API] ${config.method?.toUpperCase()} ${config.url}`));
          return config;
        },
        (error) => {
          console.error(chalk.red('[API] Request error:'), error.message);
          return Promise.reject(error);
        }
      );
    }
  }
  
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }
  
  async generateText(prompt: string, options: any = {}) {
    const response = await this.client.post('/api/generate/text', {
      prompt,
      options,
    });
    return response.data;
  }
  
  async generateStream(prompt: string, options: any = {}, onChunk: (text: string) => void) {
    const response = await this.client.post('/api/generate/stream', {
      prompt,
      options,
    }, {
      responseType: 'stream',
    });
    
    return new Promise((resolve, reject) => {
      let fullText = '';
      
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              resolve(fullText);
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                onChunk(parsed.text);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      });
      
      response.data.on('error', reject);
    });
  }
  
  async chat(message: string, context?: any, options?: any) {
    const response = await this.client.post('/api/chat', {
      message,
      context,
      options,
    });
    return response.data;
  }
  
  async listModels() {
    const response = await this.client.get('/api/models');
    return response.data;
  }
  
  async listProviders() {
    const response = await this.client.get('/api/models/providers');
    return response.data;
  }
  
  async benchmark() {
    const response = await this.client.post('/api/models/benchmark');
    return response.data;
  }
}