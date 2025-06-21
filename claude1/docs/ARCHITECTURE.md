# Architecture Overview

## System Design

The AI Content Generator employs a hybrid architecture that seamlessly integrates both cloud-based and local AI services through an intelligent orchestration layer. This design prioritizes flexibility, privacy, and cost-effectiveness while maintaining high performance.

## Key Components

1. **API Gateway** - Fastify-based REST API with WebSocket support
2. **Hybrid Orchestrator** - Intelligent routing between local and cloud AI providers
3. **Local AI Services** - Ollama, LM Studio, LocalAI integrations
4. **Cloud AI Services** - OpenAI, Claude, Sora integrations
5. **Character Engine** - Consistency management across AI providers
6. **Content Pipeline** - Multi-stage generation workflow
7. **Storage Layer** - PostgreSQL + Redis + S3-compatible object storage

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   CLI/API   │────▶│  API Gateway │────▶│Hybrid Orchestra │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
              ┌─────▼─────┐                  ┌─────▼─────┐                ┌──────▼──────┐
              │Local LLMs │                  │Cloud APIs │                │Character DB │
              │- Ollama   │                  │- OpenAI   │                │- PostgreSQL │
              │- LM Studio│                  │- Claude   │                │- Redis      │
              │- LocalAI  │                  │- Sora     │                │- Vector DB  │
              └───────────┘                  └───────────┘                └─────────────┘
```

## Design Decisions

### Hybrid AI Architecture
- **Rationale**: Combines the privacy and cost benefits of local LLMs with the advanced capabilities of cloud services
- **Implementation**: Intelligent orchestrator routes requests based on task complexity, privacy requirements, and resource availability
- **Benefits**: Offline capability, data privacy, cost reduction, and fallback options

### Local LLM Integration
- **Ollama**: Chosen for its simplicity and extensive model support
- **LM Studio**: Selected for users preferring GUI interfaces and easy model management
- **LocalAI**: Implemented as OpenAI-compatible drop-in replacement for easy migration

### Character Consistency Engine
- **Challenge**: Maintaining character traits across different AI models
- **Solution**: Model-agnostic prompt templates with embedding-based memory retrieval
- **Storage**: Vector database for semantic search of character memories

### Performance Optimization
- **Model Quantization**: Support for Q4_K_M and Q5_K_S formats to reduce memory usage
- **Request Batching**: Group similar requests for efficient processing
- **Caching Layer**: Redis for prompt results and model states

## Service Layer Architecture

### LLMProvider Interface
```typescript
interface LLMProvider {
  name: string;
  type: 'local' | 'cloud';
  modelInfo: ModelCapabilities;
  generateText(prompt: string, options: GenerationOptions): Promise<string>;
  generateStream(prompt: string, options: GenerationOptions): AsyncGenerator<string>;
  checkHealth(): Promise<HealthStatus>;
}
```

### Orchestrator Decision Flow
1. Analyze task requirements (complexity, privacy, size)
2. Check available providers and their current load
3. Select optimal provider based on rules and metrics
4. Execute with automatic fallback on failure
5. Track performance for future optimization

## Future Considerations

### Planned Enhancements
- **Model Fine-tuning**: Custom training on domain-specific data
- **Edge Deployment**: Running models on user devices
- **Multi-modal Support**: Unified handling of text, image, audio, and video
- **Federated Learning**: Privacy-preserving model improvements

### Scalability Strategy
- **Horizontal Scaling**: Multiple LLM instances behind load balancer
- **Model Sharding**: Distribute large models across multiple GPUs
- **Request Queuing**: Priority-based processing for optimal resource usage
- **Auto-scaling**: Dynamic resource allocation based on demand

### Known Limitations
- **Hardware Requirements**: Large models require significant GPU resources
- **Context Windows**: Local models may have smaller context limits
- **Feature Parity**: Some cloud-exclusive features may not be available locally
- **Initial Setup**: Local LLM installation requires technical knowledge

---
Last updated: 2025-01-19