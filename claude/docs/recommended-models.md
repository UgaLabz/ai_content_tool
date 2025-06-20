# Recommended Models for Content Creation

## Currently Installed
- **llama3.1:8b** - Good general-purpose model with 128k context window

## Recommended Models to Install

### For Creative Writing & Storytelling
```bash
# Best for creative writing, storytelling, and narrative content
ollama pull llama3.2:3b    # Fast, creative, good for drafts
ollama pull mistral:7b     # Excellent creative writing, balanced
ollama pull neural-chat:7b  # Great for dialogue and conversational content
```

### For Technical & Blog Content
```bash
# Best for technical writing, tutorials, and blog posts
ollama pull codellama:7b   # Technical content with code examples
ollama pull deepseek-coder:6.7b  # Programming tutorials and docs
ollama pull phi3:medium    # Microsoft's model, good for structured content
```

### For Marketing & Social Media
```bash
# Best for marketing copy, social media, and promotional content
ollama pull gemma2:9b      # Google's model, great for concise content
ollama pull qwen2.5:7b     # Multilingual, good for diverse audiences
ollama pull openchat:7b    # Conversational and engaging tone
```

### For Character-Based Content
```bash
# Best for consistent character voices and dialogue
ollama pull dolphin-mistral:7b  # Uncensored, flexible for characters
ollama pull nous-hermes2:10b    # Great reasoning for complex characters
```

### Premium Models (Larger, Better Quality)
```bash
# If you have 32GB+ RAM
ollama pull llama3.1:70b    # Best overall quality
ollama pull mixtral:8x7b    # Mixture of experts, very capable
ollama pull command-r:35b   # Cohere's model, excellent for content

# Quantized versions for less RAM
ollama pull llama3.1:70b-instruct-q4_0  # 40GB instead of 70GB
ollama pull mixtral:8x7b-instruct-q4_0  # 26GB instead of 48GB
```

## Model Selection by Task

### Blog Posts & Articles
- **Primary**: mistral:7b or llama3.1:8b
- **Premium**: llama3.1:70b or mixtral:8x7b
- **Fast Draft**: llama3.2:3b

### Creative Fiction
- **Primary**: neural-chat:7b or mistral:7b
- **Character Dialogue**: dolphin-mistral:7b
- **Premium**: nous-hermes2:10b

### Technical Documentation
- **Primary**: codellama:7b or deepseek-coder:6.7b
- **General Tech**: phi3:medium
- **Premium**: mixtral:8x7b

### Marketing Copy
- **Primary**: gemma2:9b or openchat:7b
- **Social Media**: llama3.2:3b (fast and punchy)
- **Premium**: command-r:35b

### Script Writing (Video/Podcast)
- **Primary**: neural-chat:7b
- **Character Voices**: dolphin-mistral:7b
- **Premium**: llama3.1:70b

## Performance Considerations

### Speed vs Quality Trade-offs
- **Fastest**: llama3.2:3b, phi3:mini (100+ tokens/sec)
- **Balanced**: mistral:7b, llama3.1:8b (40-60 tokens/sec)
- **Best Quality**: llama3.1:70b, mixtral:8x7b (10-20 tokens/sec)

### RAM Requirements
- **8GB RAM**: 3B models only
- **16GB RAM**: 7B-8B models
- **32GB RAM**: 13B-35B models, quantized 70B
- **64GB+ RAM**: Full 70B models

### GPU Acceleration (NVIDIA)
- 3B models: GTX 1660 or better
- 7B models: RTX 3060 or better
- 70B models: RTX 4090 or A100

## Quick Start Commands

### Basic Content Creation Setup
```bash
# Essential models for most content work
ollama pull mistral:7b
ollama pull gemma2:9b
ollama pull neural-chat:7b
```

### Professional Content Suite
```bash
# For serious content creation
ollama pull llama3.1:70b-instruct-q4_0
ollama pull mixtral:8x7b-instruct-q4_0
ollama pull command-r:35b
ollama pull codellama:7b
```

### Character Development Suite
```bash
# For character-driven content
ollama pull dolphin-mistral:7b
ollama pull nous-hermes2:10b
ollama pull neural-chat:7b
```

## Testing Models

Test each model with your content type:

```bash
# Test creative writing
curl -X POST http://localhost:3000/api/generate/text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write an engaging opening paragraph for a mystery novel",
    "options": {
      "temperature": 0.8,
      "maxTokens": 200
    },
    "requirements": {
      "preferredProvider": "Ollama"
    }
  }'

# Test marketing copy
curl -X POST http://localhost:3000/api/generate/text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a compelling product description for an eco-friendly water bottle",
    "options": {
      "temperature": 0.7,
      "maxTokens": 150
    }
  }'
```

## Model Configuration

Update your orchestrator config to prefer certain models for specific tasks:

```json
{
  "routing": {
    "rules": [
      {
        "name": "Creative Content",
        "conditions": {
          "prompt": { "contains": ["story", "creative", "fiction"] }
        },
        "actions": {
          "preferredModels": ["neural-chat:7b", "mistral:7b"]
        }
      },
      {
        "name": "Technical Content",
        "conditions": {
          "prompt": { "contains": ["code", "technical", "tutorial"] }
        },
        "actions": {
          "preferredModels": ["codellama:7b", "deepseek-coder:6.7b"]
        }
      }
    ]
  }
}
```