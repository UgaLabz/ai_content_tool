# API Documentation

Base URL: `http://localhost:3000`

## Overview

The AI Content Generator API provides a RESTful interface for text generation using both local and cloud-based Large Language Models. The API supports streaming responses, multiple providers, and intelligent routing.

## Authentication

Currently, the API does not require authentication for local development. Production deployments should implement proper authentication.

## Core Endpoints

### Health Check

#### GET /health
Check API server health and list available providers.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-19T12:00:00.000Z",
  "providers": ["Ollama", "LMStudio", "OpenAI"]
}
```

### Text Generation

#### POST /api/generate/text
Generate text completion using the best available provider.

**Request:**
```json
{
  "prompt": "Write a story about a robot learning to paint",
  "options": {
    "temperature": 0.7,
    "maxTokens": 1024,
    "topP": 0.9,
    "systemPrompt": "You are a creative writer",
    "stopSequences": ["\n\n"]
  },
  "requirements": {
    "privacy": true,
    "preferredProvider": "Ollama",
    "maxLatency": 5000,
    "complexity": 5
  }
}
```

**Response:**
```json
{
  "text": "Generated text content...",
  "model": "llama3.1:8b",
  "provider": "Ollama",
  "latency": 1234,
  "usage": {
    "promptTokens": 15,
    "completionTokens": 256,
    "totalTokens": 271
  }
}
```

#### POST /api/generate/stream
Generate text with Server-Sent Events streaming.

**Request:** Same as `/api/generate/text`

**Response:** Server-Sent Events stream
```
data: {"text": "Once"}
data: {"text": " upon"}
data: {"text": " a"}
data: {"text": " time"}
data: [DONE]
```

### Chat Interface

#### POST /api/chat
Interactive chat with conversation history.

**Request:**
```json
{
  "message": "Tell me about quantum computing",
  "context": {
    "sessionId": "unique-session-id",
    "characterId": "professor-smith",
    "conversationHistory": [
      {
        "role": "user",
        "content": "Hello!"
      },
      {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      }
    ]
  },
  "options": {
    "temperature": 0.7,
    "maxTokens": 1024,
    "systemPrompt": "You are a helpful AI assistant"
  }
}
```

**Response:**
```json
{
  "response": "Quantum computing is a revolutionary approach...",
  "model": "llama3.1:8b",
  "provider": "Ollama",
  "usage": {
    "promptTokens": 50,
    "completionTokens": 200,
    "totalTokens": 250
  },
  "context": {
    "sessionId": "unique-session-id",
    "characterId": "professor-smith"
  }
}
```

### Model Management

#### GET /api/models
List all available models across providers.

**Response:**
```json
{
  "models": [
    {
      "id": "llama3.1:8b",
      "name": "llama3.1:8b",
      "provider": "Ollama",
      "type": "local",
      "size": "8B",
      "quantization": "Q4_K_M",
      "capabilities": {
        "contextWindow": 128000,
        "maxOutputTokens": 4096,
        "supportsFunctions": false,
        "supportsVision": false,
        "supportsStreaming": true
      }
    }
  ]
}
```

#### GET /api/models/providers
Get provider information and health status.

**Response:**
```json
{
  "providers": [
    {
      "name": "Ollama",
      "type": "local",
      "healthy": true,
      "latency": 45,
      "metrics": {
        "averageLatency": 1234,
        "successRate": 0.98,
        "totalRequests": 1000,
        "failedRequests": 20,
        "lastUsed": "2025-01-19T12:00:00.000Z"
      }
    }
  ]
}
```

#### POST /api/models/benchmark
Benchmark all available providers.

**Response:**
```json
{
  "benchmarks": [
    {
      "provider": "Ollama",
      "averageLatency": 1234,
      "successRate": 0.98,
      "totalRequests": 10,
      "failedRequests": 0
    }
  ]
}
```

## Request Parameters

### Generation Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `temperature` | number | 0.7 | Controls randomness (0-2) |
| `maxTokens` | number | 1024 | Maximum tokens to generate |
| `topP` | number | 0.9 | Nucleus sampling parameter |
| `topK` | number | - | Top-K sampling parameter |
| `systemPrompt` | string | - | System instruction |
| `stopSequences` | string[] | [] | Stop generation sequences |

### Generation Requirements

| Parameter | Type | Description |
|-----------|------|-------------|
| `privacy` | boolean | Force local-only providers |
| `preferredProvider` | string | Preferred provider name |
| `maxLatency` | number | Maximum acceptable latency (ms) |
| `complexity` | number | Task complexity (1-10) |

## Error Responses

All errors follow this format:
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `PROVIDER_UNAVAILABLE` | 503 | No healthy providers available |
| `GENERATION_FAILED` | 500 | All generation attempts failed |
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `MODEL_NOT_FOUND` | 404 | Requested model not found |
| `RATE_LIMITED` | 429 | Too many requests |

## Rate Limiting

Default rate limits:
- 100 requests per minute per IP
- Streaming endpoints count as 1 request

## WebSocket Support (Coming Soon)

Future support for persistent WebSocket connections for real-time chat.

## SDK Examples

### JavaScript/TypeScript
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Generate text
const response = await api.post('/api/generate/text', {
  prompt: 'Hello, world!',
  options: { temperature: 0.8 }
});

console.log(response.data.text);
```

### Python
```python
import requests

response = requests.post('http://localhost:3000/api/generate/text', 
  json={
    'prompt': 'Hello, world!',
    'options': {'temperature': 0.8}
  }
)

print(response.json()['text'])
```

### cURL
```bash
curl -X POST http://localhost:3000/api/generate/text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, world!",
    "options": {"temperature": 0.8}
  }'
```

---
Last updated: 2025-01-19