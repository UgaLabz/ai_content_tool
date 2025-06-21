import { 
  TaskAnalyzer, 
  ModelMatcher, 
  CostOptimizer, 
  PerformancePredictor,
  ResourceMonitor 
} from '../../../src/services/hybrid/intelligence';
import { GenerationTask, LLMProvider, ModelInfo } from '../../../src/models/types';

describe('Intelligence Layer', () => {
  describe('TaskAnalyzer', () => {
    let analyzer: TaskAnalyzer;
    
    beforeEach(() => {
      analyzer = new TaskAnalyzer();
    });
    
    it('should analyze simple task complexity', () => {
      const task: GenerationTask = {
        prompt: 'Hello, how are you?',
        options: {},
      };
      
      const complexity = analyzer.analyzeComplexity(task);
      
      expect(complexity.score).toBeLessThanOrEqual(3);
      expect(complexity.recommendedModelSize).toBe('small');
      expect(complexity.factors.reasoning).toBe(false);
      expect(complexity.factors.codeGeneration).toBe(false);
    });
    
    it('should detect code generation tasks', () => {
      const task: GenerationTask = {
        prompt: 'Write a Python function to calculate fibonacci numbers',
        options: {},
      };
      
      const complexity = analyzer.analyzeComplexity(task);
      
      expect(complexity.factors.codeGeneration).toBe(true);
      expect(complexity.score).toBeGreaterThan(3);
    });
    
    it('should detect reasoning tasks', () => {
      const task: GenerationTask = {
        prompt: 'Why does water boil at 100 degrees Celsius? Explain the physics.',
        options: {},
      };
      
      const complexity = analyzer.analyzeComplexity(task);
      
      expect(complexity.factors.reasoning).toBe(true);
      expect(complexity.score).toBeGreaterThan(3);
    });
    
    it('should analyze task requirements', () => {
      const task: GenerationTask = {
        prompt: 'Translate this text from English to Spanish',
        options: { maxTokens: 2048 },
      };
      
      const requirements = analyzer.analyzeRequirements(task);
      
      expect(requirements.taskType).toBe('translation');
      expect(requirements.minContextWindow).toBeGreaterThanOrEqual(4096);
      expect(requirements.needsStreaming).toBe(true);
    });
    
    it('should detect vision requirements', () => {
      const task: GenerationTask = {
        prompt: 'Describe what you see in this image',
        options: {},
        requirements: { vision: true },
      };
      
      const requirements = analyzer.analyzeRequirements(task);
      
      expect(requirements.needsVision).toBe(true);
    });
  });
  
  describe('ModelMatcher', () => {
    let matcher: ModelMatcher;
    let mockProviders: LLMProvider[];
    
    beforeEach(() => {
      matcher = new ModelMatcher();
      
      mockProviders = [
        {
          name: 'Ollama-Small',
          type: 'local',
          modelInfo: {
            id: 'llama3.1:8b',
            name: 'llama3.1:8b',
            provider: 'Ollama',
            size: '8B',
            capabilities: {
              contextWindow: 8192,
              maxOutputTokens: 4096,
              supportsFunctions: true,
              supportsVision: false,
              supportsStreaming: true,
            },
          },
          generateText: jest.fn(),
          generateStream: jest.fn(),
          checkHealth: jest.fn().mockResolvedValue({ healthy: true }),
        },
        {
          name: 'LocalAI-Vision',
          type: 'local',
          modelInfo: {
            id: 'llava-v1.5',
            name: 'llava-v1.5',
            provider: 'LocalAI',
            size: '7B',
            capabilities: {
              contextWindow: 4096,
              maxOutputTokens: 2048,
              supportsFunctions: true,
              supportsVision: true,
              supportsStreaming: true,
            },
          },
          generateText: jest.fn(),
          generateStream: jest.fn(),
          checkHealth: jest.fn().mockResolvedValue({ healthy: true }),
        },
      ];
    });
    
    it('should match model to task complexity', () => {
      const complexity = {
        score: 3,
        factors: {
          tokenCount: 500,
          contextDepth: 1,
          reasoning: false,
          creativity: false,
          multiStep: false,
          domainSpecific: false,
          codeGeneration: false,
          multiModal: false,
        },
        recommendedModelSize: 'small' as const,
      };
      
      const requirements = {
        minContextWindow: 4096,
        needsFunctionCalling: false,
        needsVision: false,
        needsStreaming: true,
        estimatedTokens: 1000,
        taskType: 'chat' as const,
      };
      
      const match = matcher.findBestMatch(mockProviders, complexity, requirements);
      
      expect(match).not.toBeNull();
      expect(match?.provider.name).toBe('Ollama-Small');
      expect(match?.score).toBeGreaterThan(70);
    });
    
    it('should prefer vision models for vision tasks', () => {
      const complexity = {
        score: 5,
        factors: {
          tokenCount: 200,
          contextDepth: 1,
          reasoning: false,
          creativity: false,
          multiStep: false,
          domainSpecific: false,
          codeGeneration: false,
          multiModal: true,
        },
        recommendedModelSize: 'medium' as const,
      };
      
      const requirements = {
        minContextWindow: 2048,
        needsFunctionCalling: false,
        needsVision: true,
        needsStreaming: true,
        estimatedTokens: 500,
        taskType: 'chat' as const,
      };
      
      const match = matcher.findBestMatch(mockProviders, complexity, requirements);
      
      expect(match).not.toBeNull();
      expect(match?.provider.name).toBe('LocalAI-Vision');
      expect(match?.reasons).toContain('Multi-modal capable');
    });
  });
  
  describe('CostOptimizer', () => {
    let optimizer: CostOptimizer;
    let mockProvider: LLMProvider;
    
    beforeEach(() => {
      optimizer = new CostOptimizer();
      
      mockProvider = {
        name: 'Ollama',
        type: 'local',
        modelInfo: {
          id: 'llama3.1:8b',
          name: 'llama3.1:8b',
          provider: 'Ollama',
          size: '8B',
          capabilities: {
            contextWindow: 8192,
            maxOutputTokens: 4096,
            supportsFunctions: true,
            supportsVision: false,
            supportsStreaming: true,
          },
        },
        generateText: jest.fn(),
        generateStream: jest.fn(),
        checkHealth: jest.fn(),
      };
    });
    
    it('should estimate costs for local providers', () => {
      const requirements = {
        minContextWindow: 4096,
        needsFunctionCalling: false,
        needsVision: false,
        needsStreaming: true,
        estimatedTokens: 1000,
        taskType: 'chat' as const,
      };
      
      const estimate = optimizer.estimateCost(mockProvider, requirements);
      
      expect(estimate.provider).toBe('Ollama');
      expect(estimate.estimatedCost).toBeLessThan(0.001); // Very low cost for local
      expect(estimate.totalTokens).toBe(1000);
      expect(estimate.breakdown.inputTokens).toBe(600);
      expect(estimate.breakdown.outputTokens).toBe(400);
    });
    
    it('should optimize provider selection by cost', () => {
      const providers = [mockProvider];
      const requirements = {
        minContextWindow: 4096,
        needsFunctionCalling: false,
        needsVision: false,
        needsStreaming: true,
        estimatedTokens: 1000,
        taskType: 'chat' as const,
      };
      
      const complexity = {
        score: 3,
        factors: {} as any,
        recommendedModelSize: 'small' as const,
      };
      
      const optimized = optimizer.optimizeSelection(
        providers,
        requirements,
        complexity,
        { preferFreeProviders: true }
      );
      
      expect(optimized).toHaveLength(1);
      expect(optimized[0].type).toBe('local');
    });
  });
  
  describe('PerformancePredictor', () => {
    let predictor: PerformancePredictor;
    let mockProvider: LLMProvider;
    
    beforeEach(() => {
      predictor = new PerformancePredictor();
      
      mockProvider = {
        name: 'Ollama',
        type: 'local',
        modelInfo: {
          id: 'llama3.1:8b',
          name: 'llama3.1:8b',
          provider: 'Ollama',
          size: '8B',
          capabilities: {
            contextWindow: 8192,
            maxOutputTokens: 4096,
            supportsFunctions: true,
            supportsVision: false,
            supportsStreaming: true,
          },
        },
        generateText: jest.fn(),
        generateStream: jest.fn(),
        checkHealth: jest.fn(),
      };
    });
    
    it('should predict performance for local providers', () => {
      const requirements = {
        minContextWindow: 4096,
        needsFunctionCalling: false,
        needsVision: false,
        needsStreaming: true,
        estimatedTokens: 1000,
        taskType: 'chat' as const,
      };
      
      const complexity = {
        score: 3,
        factors: {} as any,
        recommendedModelSize: 'small' as const,
      };
      
      const prediction = predictor.predict(mockProvider, requirements, complexity);
      
      expect(prediction.provider).toBe('Ollama');
      expect(prediction.estimatedLatency).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThanOrEqual(0.5);
      expect(prediction.reliability).toBeGreaterThanOrEqual(0.9);
      expect(prediction.throughput).toBeGreaterThan(0);
    });
    
    it('should record and use historical performance', () => {
      predictor.recordActualPerformance('Ollama', 1500, 1000, true, 'llama3.1:8b');
      predictor.recordActualPerformance('Ollama', 1600, 1000, true, 'llama3.1:8b');
      predictor.recordActualPerformance('Ollama', 1400, 1000, true, 'llama3.1:8b');
      
      const stats = predictor.getPerformanceStats('Ollama');
      
      expect(stats.avgLatency).toBeCloseTo(1500, 0);
      expect(stats.successRate).toBe(1);
      expect(stats.totalRequests).toBe(3);
    });
  });
  
  describe('ResourceMonitor', () => {
    let monitor: ResourceMonitor;
    
    beforeEach(() => {
      monitor = new ResourceMonitor();
    });
    
    afterEach(() => {
      monitor.stopMonitoring();
    });
    
    it('should get current system resources', () => {
      const resources = monitor.getCurrentResources();
      
      expect(resources.cpu.cores).toBeGreaterThan(0);
      expect(resources.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(resources.cpu.usage).toBeLessThanOrEqual(100);
      expect(resources.memory.total).toBeGreaterThan(0);
      expect(resources.memory.usage).toBeGreaterThanOrEqual(0);
      expect(resources.memory.usage).toBeLessThanOrEqual(100);
    });
    
    it('should check if system can handle load', () => {
      const canHandle = monitor.canHandleLoad(100, 10); // 100MB, 10% CPU
      
      expect(typeof canHandle).toBe('boolean');
    });
    
    it('should recommend provider type based on resources', () => {
      const recommendation = monitor.getRecommendedProviderType();
      
      expect(['local', 'cloud', 'any']).toContain(recommendation);
    });
    
    it('should start and stop monitoring', (done) => {
      monitor.startMonitoring(100); // 100ms interval
      
      setTimeout(() => {
        const history = monitor.getResourceHistory();
        expect(history.length).toBeGreaterThan(0);
        
        monitor.stopMonitoring();
        const lengthAfterStop = monitor.getResourceHistory().length;
        
        setTimeout(() => {
          expect(monitor.getResourceHistory().length).toBe(lengthAfterStop);
          done();
        }, 200);
      }, 300);
    });
  });
});