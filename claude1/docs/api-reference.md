# API Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, the API does not require authentication. In production, implement API key authentication.

## Endpoints

### Health Check
```http
GET /health
```

Returns server health status and available providers.

### Generation Endpoints

#### Text Generation
```http
POST /api/generate/text
Content-Type: application/json

{
  "prompt": "Write a poem about the sea",
  "options": {
    "temperature": 0.7,
    "maxTokens": 200,
    "topP": 0.9,
    "topK": 40,
    "systemPrompt": "You are a helpful assistant",
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
    "promptTokens": 10,
    "completionTokens": 50,
    "totalTokens": 60
  }
}
```

#### Streaming Generation
```http
POST /api/generate/stream
Content-Type: application/json

{
  "prompt": "Tell me a story",
  "options": {
    "temperature": 0.8,
    "maxTokens": 500
  },
  "requirements": {
    "privacy": false,
    "maxLatency": 10000
  }
}
```

**Response:** Server-Sent Events stream
```
data: {"text": "Once"}
data: {"text": " upon"}
data: {"text": " a"}
data: {"text": " time"}
data: [DONE]
```

Returns Server-Sent Events (SSE) stream.

### Intelligence & Monitoring

#### Intelligence Report
```http
GET /api/intelligence/report
```

**Response:**
```json
{
  "providers": {
    "Ollama": {
      "requests": 100,
      "successRate": 0.98,
      "avgLatency": 1234,
      "totalCost": 0.05
    }
  },
  "models": {
    "llama3.1:8b": {
      "requests": 80,
      "avgTokens": 150
    }
  },
  "recommendations": [
    "Consider using smaller models for simple tasks",
    "Enable caching for repeated queries"
  ]
}
```

#### Performance Stats
```http
GET /api/performance/stats
```

**Response:**
```json
{
  "cache": {
    "hits": 245,
    "misses": 755,
    "hitRate": 0.245
  },
  "batch": {
    "totalBatches": 50,
    "avgBatchSize": 3.2
  },
  "pool": {
    "activeConnections": 2,
    "idleConnections": 3
  }
}
```

#### Maintenance
```http
POST /api/maintenance
```

Performs cache cleanup, connection pool optimization, and other maintenance tasks.

### Chat Endpoints

#### Chat Conversation
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Hello, how are you?",
  "context": {
    "sessionId": "optional-session-id",
    "characterId": "optional-character-id",
    "conversationHistory": [
      {
        "role": "user",
        "content": "Previous message"
      },
      {
        "role": "assistant",
        "content": "Previous response"
      }
    ]
  },
  "options": {
    "temperature": 0.7,
    "maxTokens": 500,
    "systemPrompt": "You are a helpful assistant"
  }
}
```

**Response:**
```json
{
  "response": "I'm doing well, thank you! How can I help you today?",
  "model": "llama3.1:8b",
  "provider": "Ollama",
  "sessionId": "generated-session-id"
}
```

### Model Management

#### List Available Models
```http
GET /api/models
```

**Response:**
```json
{
  "models": [
    {
      "id": "llama3.1:8b",
      "name": "Llama 3.1 8B",
      "provider": "Ollama",
      "size": 4660000000,
      "capabilities": ["text-generation", "conversation"],
      "contextLength": 8192
    }
  ]
}
```

#### Check Provider Status
```http
GET /api/models/providers
```

**Response:**
```json
{
  "providers": [
    {
      "name": "Ollama",
      "status": "online",
      "models": ["llama3.1:8b", "snowflake-arctic-embed:33m"]
    },
    {
      "name": "LMStudio",
      "status": "offline",
      "models": []
    }
  ]
}
```

### Character Management

#### Create Character
```http
POST /api/characters
Content-Type: application/json

{
  "id": "unique-id",
  "name": "Character Name",
  "description": "Character description",
  "avatar": "base64-encoded-image-or-url",
  "personality": {
    "openness": 80,
    "conscientiousness": 75,
    "extraversion": 60,
    "agreeableness": 85,
    "neuroticism": 30,
    "traits": ["creative", "analytical", "patient"],
    "values": ["knowledge", "integrity", "growth"],
    "quirks": ["taps fingers when thinking", "uses metaphors"]
  },
  "background": {
    "origin": "Brief backstory",
    "education": "Educational background",
    "experience": "Professional experience",
    "relationships": ["mentor", "colleague"]
  },
  "voice": {
    "tone": "friendly",
    "formality": "moderate",
    "vocabulary": "professional",
    "catchphrases": ["Let's think about this", "Interesting perspective"],
    "speechPatterns": ["asks clarifying questions", "provides examples"]
  },
  "knowledge": [
    {
      "domain": "technology",
      "expertise": "high",
      "topics": ["AI", "software development", "system design"]
    }
  ],
  "capabilities": {
    "canGenerateImages": false,
    "canAnalyzeImages": true,
    "preferredModels": ["llama3.1:70b", "mixtral:8x7b"]
  }
}
```

**Response:**
```json
{
  "id": "generated-uuid",
  "name": "Character Name",
  "description": "Character description",
  "avatar": "https://api.example.com/avatars/generated-uuid.jpg",
  "personality": { /* ... */ },
  "background": { /* ... */ },
  "voice": { /* ... */ },
  "knowledge": [ /* ... */ ],
  "capabilities": { /* ... */ },
  "createdAt": "2025-01-20T12:00:00Z",
  "updatedAt": "2025-01-20T12:00:00Z"
}
```

#### List Characters
```http
GET /api/characters?page=1&limit=20&search=sherlock&tags=detective,analytical
```

**Response:**
```json
{
  "characters": [
    {
      "id": "character-id",
      "name": "Character Name",
      "description": "Brief description",
      "avatar": "avatar-url",
      "tags": ["detective", "analytical"],
      "createdAt": "2025-01-20T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

#### Get Character
```http
GET /api/characters/{characterId}
```

**Response:** Full character object as shown in Create Character response

#### Update Character
```http
PATCH /api/characters/{characterId}
Content-Type: application/json

{
  /* partial character object - only fields to update */
  "personality": {
    "traits": ["creative", "analytical", "patient", "curious"]
  }
}
```

#### Delete Character
```http
DELETE /api/characters/{characterId}
```

**Response:**
```json
{
  "success": true,
  "message": "Character deleted successfully"
}
```

### Memory Management

#### Add Memory
```http
POST /api/characters/{characterId}/memories
Content-Type: application/json

{
  "type": "interaction",
  "content": "Memory content",
  "importance": 70,
  "retentionPriority": "medium"
}
```

#### Get Memories
```http
GET /api/characters/{characterId}/memories?count=10&types=interaction,fact
```

#### Search Memories
```http
GET /api/characters/{characterId}/memories/search?q=keyword&minImportance=50
```

### Configuration

#### Get Current Configuration
```http
GET /api/config
```

**Response:**
```json
{
  "providers": {
    "ollama": {
      "enabled": true,
      "models": ["llama3.1:8b"]
    }
  },
  "routing": {
    "rules": [
      {
        "name": "Use Small Models for Simple Tasks",
        "conditions": {
          "complexity": { "max": 3 }
        },
        "actions": {
          "modelSizePreference": "small"
        }
      }
    ]
  }
}
```

#### Update Configuration
```http
PUT /api/config
Content-Type: application/json

{
  /* Same structure as GET response */
}
```


## Response Formats

### Success Response
```json
{
  "content": "Generated text",
  "model": "llama3.1:8b",
  "provider": "ollama",
  "usage": {
    "promptTokens": 50,
    "completionTokens": 150,
    "totalTokens": 200
  },
  "latency": 1234
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    /* additional error context */
  }
}
```

### Character Response
```json
{
  "content": "Character's response",
  "characterId": "character-id",
  "consistency": {
    "overall": 85,
    "personality": 90,
    "voice": 85,
    "knowledge": 80,
    "emotional": 85,
    "details": []
  },
  "metadata": {
    "generationTime": 1500,
    "modelUsed": "llama3.1:70b",
    "retriedForConsistency": false
  }
}
```

## Data Mapping

### API to Frontend Character Mapping

The API returns character data in a backend-optimized format, which is transformed for frontend consumption:

**Backend Format:**
```typescript
{
  id: string;
  name: string;
  description: string;
  personality: {
    traits: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    coreTraits: string[];
    values: string[];
    quirks: string[];
  };
  // ... other fields
}
```

**Frontend Format:**
```typescript
{
  id: string;
  name: string;
  description: string;
  avatar?: string;
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    traits: string[];
    values: string[];
    quirks: string[];
  };
  // ... mapped fields
}
```

The `character-response-mapper.ts` service handles this transformation automatically.

## Error Codes

| Code | Description |
|------|-------------|
| `PROVIDER_NOT_AVAILABLE` | Requested provider is offline |
| `MODEL_NOT_FOUND` | Model doesn't exist |
| `CONTEXT_TOO_LONG` | Prompt exceeds model's context window |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INVALID_CHARACTER` | Character profile validation failed |
| `MEMORY_QUOTA_EXCEEDED` | Character memory limit reached |

## Rate Limits

Default rate limits:
- 100 requests per minute per IP
- 10 concurrent streaming connections
- 1MB max request body size

## WebSocket Endpoints

### Streaming Chat
```
ws://localhost:3000/ws/chat/{sessionId}
```

Send and receive messages in real-time.

## Examples

### Python Client
```python
import requests

# Basic generation
response = requests.post('http://localhost:3000/api/generate/text', json={
    'prompt': 'Hello, world!',
    'options': {
        'temperature': 0.7,
        'maxTokens': 100
    }
})

print(response.json()['text'])
```

### JavaScript Client
```javascript
// Streaming generation
const response = await fetch('http://localhost:3000/api/generate/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        prompt: 'Tell me a story',
        options: { temperature: 0.8 }
    })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            process.stdout.write(data.content);
        }
    }
}
```

### cURL Examples
```bash
# List models
curl http://localhost:3000/api/models

# Chat with character context
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What do you think about the case?",
    "context": {
      "characterId": "sherlock-holmes"
    },
    "options": {
      "temperature": 0.7
    }
  }'

# Get performance stats
curl http://localhost:3000/api/performance/stats
```