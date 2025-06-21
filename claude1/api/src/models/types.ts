export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  stream?: boolean;
}

export interface ModelCapabilities {
  contextWindow: number;
  maxOutputTokens: number;
  supportsFunctions: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  costPer1kTokens?: {
    input: number;
    output: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  size: string;
  quantization?: string;
  capabilities: ModelCapabilities;
}

export interface HealthStatus {
  healthy: boolean;
  latency?: number;
  error?: string;
  modelLoaded?: boolean;
}

export interface GenerationResult {
  text: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency: number;
}

export interface GenerationTask {
  prompt: string;
  options: GenerationOptions;
  context?: {
    characterId?: string;
    sessionId?: string;
    conversationHistory?: Message[];
  };
  requirements?: {
    maxLatency?: number;
    privacy?: boolean;
    complexity?: number;
    preferredProvider?: string;
  };
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface LLMProvider {
  name: string;
  type: 'local' | 'cloud';
  modelInfo: ModelInfo;
  
  initialize(): Promise<void>;
  generateText(prompt: string, options: GenerationOptions): Promise<string>;
  generateStream(prompt: string, options: GenerationOptions): AsyncGenerator<string>;
  generateCompletion(messages: Message[], options: GenerationOptions): Promise<GenerationResult>;
  checkHealth(): Promise<HealthStatus>;
  listModels(): Promise<ModelInfo[]>;
  loadModel(modelId: string): Promise<void>;
  unloadModel(): Promise<void>;
}

export interface CharacterProfile {
  id: string;
  name: string;
  archetype: string;
  traits: string[];
  backstory: string;
  visualDescription: string;
  voiceProfile: {
    tone: string;
    speakingStyle: string;
    catchphrases?: string[];
  };
  memories: CharacterMemory[];
  relationships: CharacterRelationship[];
}

export interface CharacterMemory {
  id: string;
  characterId: string;
  eventType: 'interaction' | 'observation' | 'thought' | 'emotion';
  content: string;
  importance: number;
  timestamp: Date;
  relatedCharacters?: string[];
}

export interface CharacterRelationship {
  characterId: string;
  targetCharacterId: string;
  relationshipType: string;
  strength: number;
  history: string[];
}