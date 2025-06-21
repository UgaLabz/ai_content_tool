# AI Content CLI

Command-line interface for the AI Content Generator, supporting both local and cloud-based LLMs.

## Installation

```bash
npm install
npm run build
npm link  # Makes 'ai-content' command available globally
```

## Usage

### Generate Text

```bash
# Basic generation
ai-content generate "Write a haiku about coding"

# With options
ai-content generate "Explain quantum computing" -t 0.5 -m 200

# Force privacy mode (local only)
ai-content generate "Sensitive prompt" --privacy

# Stream the response
ai-content generate "Tell me a story" --stream

# Use specific provider
ai-content generate "Hello world" -p Ollama
```

### Interactive Chat

```bash
# Start chat session
ai-content chat

# With custom settings
ai-content chat -t 0.8 --privacy

# With system prompt
ai-content chat --system "You are a helpful coding assistant"
```

### Model Management

```bash
# List available models
ai-content models

# Show provider status
ai-content models --providers

# List downloadable models
ai-content models available
```

### Benchmark Providers

```bash
# Run performance benchmark
ai-content benchmark
```

### Configuration

```bash
# Interactive configuration
ai-content config

# List current config
ai-content config --list

# Set specific value
ai-content config set apiUrl http://localhost:3000
ai-content config set defaultProvider Ollama
ai-content config set privacyMode true

# Reset to defaults
ai-content config --reset
```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `generate <prompt>` | `gen` | Generate text from a prompt |
| `chat` | - | Start interactive chat session |
| `models` | - | List and manage AI models |
| `benchmark` | `bench` | Benchmark provider performance |
| `config` | - | Configure CLI settings |

## Options

### Generate Command
- `-t, --temperature <number>` - Generation temperature (0-2)
- `-m, --max-tokens <number>` - Maximum tokens to generate
- `-p, --provider <name>` - Preferred provider
- `--privacy` - Force local-only providers
- `-s, --stream` - Stream the response
- `--system <prompt>` - System prompt for context

### Chat Command
- `-p, --provider <name>` - Preferred provider
- `--privacy` - Force local-only providers
- `-t, --temperature <number>` - Generation temperature
- `-c, --character <id>` - Use character profile
- `--system <prompt>` - System prompt

## Configuration

Settings are stored in `~/.ai-content/config.json`:

```json
{
  "apiUrl": "http://localhost:3000",
  "defaultProvider": "Ollama",
  "privacyMode": false,
  "temperature": 0.7,
  "maxTokens": 1024
}
```

## Examples

### Quick Text Generation
```bash
ai-content gen "Write a Python function to sort a list"
```

### Private Document Summary
```bash
ai-content gen "Summarize this document: [content]" --privacy
```

### Code Review Assistant
```bash
ai-content chat --system "You are a code review expert. Help me improve my code."
```

### Model Comparison
```bash
# Benchmark all providers
ai-content benchmark

# Test specific prompt on different models
ai-content gen "Same prompt" -p Ollama
ai-content gen "Same prompt" -p LMStudio
```

## Troubleshooting

### API Connection Failed
```bash
# Check if API is running
curl http://localhost:3000/health

# Start API server
cd ../api && npm run dev
```

### No Models Available
```bash
# Check Ollama is running
ollama list

# Pull a model
ollama pull llama3.1:8b
```

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```