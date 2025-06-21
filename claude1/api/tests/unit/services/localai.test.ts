import { LocalAIService } from '../../../src/services/local/localai/LocalAIService';
import { LocalAIConfig } from '../../../src/services/local/localai/LocalAIConfig';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
      models: {
        list: jest.fn(),
      },
      embeddings: {
        create: jest.fn(),
      },
      images: {
        generate: jest.fn(),
      },
    })),
  };
});

// Mock fetch for health checks
global.fetch = jest.fn();

describe('LocalAIService', () => {
  let service: LocalAIService;
  let mockOpenAI: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    const config: LocalAIConfig = {
      baseUrl: 'http://localhost',
      port: 8080,
      defaultModel: 'llama3',
    };
    service = new LocalAIService(config);
    
    // Get mocked OpenAI instance
    const OpenAI = require('openai').default;
    mockOpenAI = new OpenAI();
  });
  
  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      expect(service.name).toBe('LocalAI');
      expect(service.modelInfo.provider).toBe('LocalAI');
    });
    
    it('should check health on initialization', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });
      
      mockOpenAI.models.list.mockResolvedValueOnce({
        [Symbol.asyncIterator]: async function* () {
          yield { id: 'llama3', created: Date.now(), object: 'model', owned_by: 'localai' };
        },
      });
      
      await service.initialize();
      
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/readyz');
    });
  });
  
  describe('checkHealth', () => {
    it('should return healthy status when service is running', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });
      
      const health = await service.checkHealth();
      
      expect(health.healthy).toBe(true);
      expect(health.message).toBe('LocalAI is running');
    });
    
    it('should return unhealthy status when service is down', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));
      
      const health = await service.checkHealth();
      
      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Connection refused');
    });
  });
  
  describe('generateText', () => {
    it('should generate text using OpenAI-compatible API', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Generated response' },
        }],
      };
      
      mockOpenAI.chat.completions.create.mockResolvedValueOnce(mockResponse);
      
      const result = await service.generateText('Test prompt');
      
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'llama3',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
        stop: undefined,
        stream: false,
      });
      expect(result).toBe('Generated response');
    });
    
    it('should include system prompt when provided', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Generated response' },
        }],
      };
      
      mockOpenAI.chat.completions.create.mockResolvedValueOnce(mockResponse);
      
      await service.generateText('Test prompt', {
        systemPrompt: 'You are a helpful assistant',
      });
      
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Test prompt' },
          ],
        })
      );
    });
  });
  
  describe('generateStream', () => {
    it('should stream text generation', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Hello' } }] };
          yield { choices: [{ delta: { content: ' world' } }] };
        },
      };
      
      mockOpenAI.chat.completions.create.mockResolvedValueOnce(mockStream);
      
      const chunks: string[] = [];
      for await (const chunk of service.generateStream('Test prompt')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(['Hello', ' world']);
    });
  });
  
  describe('listModels', () => {
    it('should list available models', async () => {
      const mockModels = {
        [Symbol.asyncIterator]: async function* () {
          yield { id: 'llama3', created: Date.now(), object: 'model', owned_by: 'localai' };
          yield { id: 'mistral', created: Date.now(), object: 'model', owned_by: 'localai' };
        },
      };
      
      mockOpenAI.models.list.mockResolvedValueOnce(mockModels);
      
      const models = await service.listModels();
      
      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('llama3');
      expect(models[1].id).toBe('mistral');
    });
  });
  
  describe('multi-modal features', () => {
    it('should generate images', async () => {
      const mockResponse = {
        data: [
          { url: 'http://localhost:8080/generated/image1.png' },
        ],
      };
      
      mockOpenAI.images.generate.mockResolvedValueOnce(mockResponse);
      
      const images = await service.generateImage('A beautiful landscape');
      
      expect(mockOpenAI.images.generate).toHaveBeenCalledWith({
        prompt: 'A beautiful landscape',
        model: 'stablediffusion',
        n: 1,
        size: '512x512',
      });
      expect(images).toEqual(['http://localhost:8080/generated/image1.png']);
    });
    
    it('should generate embeddings', async () => {
      const mockResponse = {
        data: [
          { embedding: [0.1, 0.2, 0.3] },
          { embedding: [0.4, 0.5, 0.6] },
        ],
      };
      
      mockOpenAI.embeddings.create.mockResolvedValueOnce(mockResponse);
      
      const embeddings = await service.generateEmbeddings(['text1', 'text2']);
      
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: ['text1', 'text2'],
      });
      expect(embeddings).toEqual([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]);
    });
    
    it('should handle TTS requests', async () => {
      const mockAudioData = Buffer.from('audio data');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValueOnce(mockAudioData.buffer),
      });
      
      const audio = await service.generateSpeech('Hello world');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/audio/speech',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            model: 'tts-1',
            input: 'Hello world',
            voice: 'alloy',
            speed: 1.0,
          }),
        })
      );
      expect(audio).toBeInstanceOf(Buffer);
    });
  });
  
  describe('model capabilities detection', () => {
    it('should detect vision model capabilities', async () => {
      const mockModels = {
        [Symbol.asyncIterator]: async function* () {
          yield { id: 'llava-v1.5', created: Date.now(), object: 'model', owned_by: 'localai' };
          yield { id: 'bakllava', created: Date.now(), object: 'model', owned_by: 'localai' };
          yield { id: 'llama3', created: Date.now(), object: 'model', owned_by: 'localai' };
        },
      };
      
      mockOpenAI.models.list.mockResolvedValueOnce(mockModels);
      
      const models = await service.listModels();
      
      expect(models[0].capabilities.supportsVision).toBe(true); // llava
      expect(models[1].capabilities.supportsVision).toBe(true); // bakllava
      expect(models[2].capabilities.supportsVision).toBe(false); // llama3
    });
  });
});