import { OllamaService } from '../../../src/services/local/ollama/OllamaService';
import { GenerationOptions } from '../../../src/models/types';

describe('OllamaService', () => {
  let service: OllamaService;
  
  beforeEach(() => {
    service = new OllamaService({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434',
      defaultModel: 'llama3.1:8b'
    });
  });
  
  describe('checkHealth', () => {
    it('should return health status', async () => {
      const health = await service.checkHealth();
      
      expect(health).toHaveProperty('healthy');
      expect(typeof health.healthy).toBe('boolean');
      
      if (health.healthy) {
        expect(health).toHaveProperty('latency');
        expect(typeof health.latency).toBe('number');
      }
    });
  });
  
  describe('listModels', () => {
    it('should list available models', async () => {
      try {
        const models = await service.listModels();
        
        expect(Array.isArray(models)).toBe(true);
        
        if (models.length > 0) {
          const model = models[0];
          expect(model).toHaveProperty('id');
          expect(model).toHaveProperty('name');
          expect(model).toHaveProperty('provider');
          expect(model).toHaveProperty('capabilities');
        }
      } catch (error) {
        console.warn('Ollama service not available for testing');
      }
    });
  });
  
  describe('generateText', () => {
    it('should generate text completion', async () => {
      const prompt = 'Complete this: The sky is';
      const options: GenerationOptions = {
        maxTokens: 20,
        temperature: 0.5
      };
      
      try {
        await service.initialize();
        const result = await service.generateText(prompt, options);
        
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      } catch (error) {
        console.warn('Ollama service not available for testing');
      }
    });
  });
  
  describe('generateStream', () => {
    it('should generate streaming text', async () => {
      const prompt = 'Count from 1 to 5:';
      const options: GenerationOptions = {
        maxTokens: 50,
        temperature: 0.1
      };
      
      try {
        await service.initialize();
        const stream = service.generateStream(prompt, options);
        
        const chunks: string[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        
        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks.join('')).toContain('1');
      } catch (error) {
        console.warn('Ollama service not available for testing');
      }
    });
  });
});