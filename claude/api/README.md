# AI Content Generator API

REST API service for the AI-powered content generation platform with support for both local and cloud-based LLMs.

## Features

- ✅ Hybrid AI architecture (local + cloud providers)
- ✅ Ollama integration for local models
- ✅ LM Studio support with TypeScript SDK
- ✅ Intelligent routing and fallback mechanisms
- ✅ Streaming response support
- ✅ Provider health monitoring and metrics
- ✅ TypeScript with full type safety
- ✅ Fastify for high performance

## Quick Start

### Prerequisites

- Node.js 20+
- Ollama installed locally (optional)
- Docker (for LocalAI, optional)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

### Running Ollama (Local LLM)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.1:8b

# Start Ollama server (runs on port 11434 by default)
ollama serve
```

### Running LM Studio (Local LLM with GUI)

1. Download LM Studio from https://lmstudio.ai/
2. Install and launch the application
3. Download models from the Browse tab (GGUF format)
4. Start the local server from the Local Server tab
5. Default WebSocket port is 1234

For detailed setup: `./scripts/setup-lmstudio.sh`

### Running LocalAI (OpenAI-Compatible Server)

```bash
# Using Docker (recommended)
cd docker/localai
docker-compose up -d

# Check health
curl http://localhost:8080/readyz

# List available models
curl http://localhost:8080/v1/models
```

LocalAI supports:
- Text generation (OpenAI-compatible)
- Image generation (Stable Diffusion)
- Speech synthesis (TTS)
- Speech recognition (Whisper)
- Embeddings generation

For detailed setup: `./scripts/setup-localai.sh`

### Development

```bash
# Start development server with hot reload
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build
```

## API Endpoints

### Health Check
```
GET /health
```

### Text Generation
```
POST /api/generate/text
{
  "prompt": "Write a story about...",
  "options": {
    "temperature": 0.7,
    "maxTokens": 1024
  },
  "requirements": {
    "privacy": true,
    "preferredProvider": "Ollama"
  }
}
```

### Streaming Generation
```
POST /api/generate/stream
Content-Type: application/json

Returns: Server-Sent Events stream
```

### Chat
```
POST /api/chat
{
  "message": "Hello!",
  "context": {
    "sessionId": "unique-session-id",
    "conversationHistory": []
  }
}
```

### List Models
```
GET /api/models
```

### List Providers
```
GET /api/models/providers
```

### Benchmark Providers
```
POST /api/models/benchmark
```

## Architecture

The API uses a hybrid orchestrator pattern that can route requests between multiple AI providers:

1. **Local Providers**: Ollama, LM Studio, LocalAI
2. **Cloud Providers**: OpenAI, Claude, etc. (coming soon)

The orchestrator intelligently selects providers based on:
- Task complexity
- Privacy requirements
- Provider availability
- Performance metrics
- Cost optimization

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | 3000 |
| `OLLAMA_HOST` | Ollama server URL | http://localhost:11434 |
| `OLLAMA_DEFAULT_MODEL` | Default Ollama model | llama3.1:8b |
| `PRIVACY_MODE` | Force all requests to local providers | false |
| `LOG_LEVEL` | Logging level | info |

### Supported Models (via Ollama)

- Llama 3.1 (8B, 70B, 405B)
- Mistral (7B)
- Mixtral (8x7B)
- Gemma (2B)
- DeepSeek models
- Any GGUF format model

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Production Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

For production deployments, consider:
- Using PM2 or systemd for process management
- Setting up reverse proxy with Nginx
- Configuring SSL certificates
- Setting appropriate rate limits
- Monitoring with Prometheus/Grafana

## Troubleshooting

### Ollama Connection Issues
- Ensure Ollama is running: `ollama serve`
- Check if model is downloaded: `ollama list`
- Verify OLLAMA_HOST in .env matches your setup

### Performance Issues
- Check available system RAM and GPU memory
- Use quantized models for better performance
- Adjust `maxTokens` and batch sizes
- Monitor with `/api/models/providers` endpoint

## License

[Your License]