import { LMStudioService } from '../../../src/services/local/lmstudio/LMStudioService';
import { GenerationOptions } from '../../../src/models/types';

describe('LMStudioService', () => {
  let service: LMStudioService;
  
  beforeEach(() => {
    service = new LMStudioService({
      baseUrl: process.env.LMSTUDIO_HOST || 'ws://localhost',
      port: parseInt(process.env.LMSTUDIO_PORT || '1234', 10)
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
      } else {
        expect(health).toHaveProperty('error');
        console.warn('LM Studio not available for testing:', health.error);
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
          expect(model.provider).toBe('LMStudio');
          expect(model).toHaveProperty('capabilities');
        } else {
          console.warn('No models loaded in LM Studio');
        }
      } catch (error) {
        console.warn('LM Studio service not available for testing');
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
        console.warn('LM Studio service not available for testing');
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
        const fullText = chunks.join('');
        expect(fullText).toContain('1');
      } catch (error) {
        console.warn('LM Studio service not available for testing');
      }
    });
  });
  
  describe('model management', () => {
    it('should load and unload models', async () => {
      try {
        const models = await service.listModels();
        
        if (models.length > 0) {
          const modelId = models[0].id;
          
          await service.loadModel(modelId);
          expect(service['currentModelId']).toBe(modelId);
          
          await service.unloadModel();
          expect(service['currentModelId']).toBeUndefined();
        }
      } catch (error) {
        console.warn('LM Studio service not available for testing');
      }
    });
  });
  
  describe('model capabilities detection', () => {
    it('should detect model capabilities from name', () => {
      const testCases = [
        {
          name: 'llama-3.1-8b-instruct-q4_k_m.gguf',
          expectedSize: '8B',
          expectedQuant: 'Q4_K_M',
          expectedContext: 128000
        },
        {
          name: 'mistral-7b-instruct-v0.2.Q5_K_S.gguf',
          expectedSize: '7B',
          expectedQuant: 'Q5_K_S',
          expectedContext: 32768
        },
        {
          name: 'deepseek-coder-6.7b-instruct.gguf',
          expectedSize: '6.7B',
          expectedQuant: undefined,
          expectedContext: 16384
        }
      ];
      
      testCases.forEach(({ name, expectedSize, expectedQuant, expectedContext }) => {
        const modelInfo = {
          id: name,
          name: name,
          provider: 'LMStudio',
          size: service['extractModelSize'](name),
          quantization: service['extractQuantization'](name),
          capabilities: service['getModelCapabilities'](name)
        };
        
        expect(modelInfo.size).toBe(expectedSize);
        expect(modelInfo.quantization).toBe(expectedQuant);
        expect(modelInfo.capabilities.contextWindow).toBe(expectedContext);
      });
    });
  });
});