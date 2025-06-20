# Quick Start Guide

Get the AI Content Generator up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed (20+ recommended)
- Git installed
- 16GB+ RAM recommended
- Ollama installed and running
- (Optional) PostgreSQL if using database features
- (Optional) Redis if using caching features
- (Optional) NVIDIA GPU for better performance

## Step 1: Install Ollama

```bash
# Install Ollama (Linux/Mac)
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service
sudo systemctl start ollama

# Pull a model
ollama pull llama3.1:8b
```

## Step 2: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/YourRepo/ai-content-generator.git
cd ai-content-generator/claude
```

## Step 3: Configure Environment Variables

```bash
# Navigate to API directory
cd api

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env file to update:
# - Database credentials (if using PostgreSQL)
# - Ollama settings (should work with defaults)
# - Any API keys for cloud services (optional)

# Start development server
npm run dev
```

The API server will start on http://localhost:3000

## Step 4: Start the API Server

```bash
# Start development server
npm run dev
```

The API server will start on http://localhost:3000

You should see:
- Ollama service initialized
- Server listening on port 3000
- Available providers listed

## Step 5: Test the API

### Quick Test with cURL

```bash
# Test health endpoint
curl http://localhost:3000/health

# Generate text
curl -X POST http://localhost:3000/api/generate/text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about coding",
    "options": {
      "temperature": 0.7,
      "maxTokens": 50
    }
  }'
```

### Test with Node.js

Create a file `test.js`:

```javascript
const axios = require('axios');

async function testGeneration() {
  try {
    const response = await axios.post('http://localhost:3000/api/generate/text', {
      prompt: 'Explain quantum computing in simple terms',
      options: {
        temperature: 0.7,
        maxTokens: 200
      }
    });
    
    console.log('Response:', response.data.text);
    console.log('Model:', response.data.model);
    console.log('Provider:', response.data.provider);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGeneration();
```

Run it:
```bash
node test.js
```

## Step 6: Available Endpoints

- `GET /health` - Check server status
- `POST /api/generate/text` - Generate text
- `POST /api/generate/stream` - Stream text generation
- `POST /api/chat` - Interactive chat
- `GET /api/models` - List available models
- `GET /api/models/providers` - Check provider status
- `POST /api/characters` - Create character profiles
- `GET /api/characters/:id` - Get character details
- `GET /api/intelligence/report` - View AI decision intelligence
- `GET /api/performance/stats` - View performance metrics

## Step 7: Using Different Models

### List Available Models
```bash
curl http://localhost:3000/api/models
```

### Pull Additional Models
```bash
# Pull a specific model
ollama pull mistral:7b
ollama pull codellama:7b
```

### Use a Specific Model
```json
{
  "prompt": "Your prompt here",
  "requirements": {
    "preferredProvider": "Ollama"
  }
}
```

## Troubleshooting

### Ollama Not Found
```bash
# Check if Ollama is running
sudo systemctl status ollama

# If not running, start it
sudo systemctl start ollama

# Check available models
ollama list

# Test Ollama directly
curl http://localhost:11434/api/tags
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 [PID]

# Or change port in .env file
PORT=3001
```

### Schema Validation Errors
If you see "schema is invalid: data/required must be array":
- This has been fixed in the latest version
- Pull the latest changes or update route files

### Memory Issues
- Use smaller models (gemma:2b, llama3.1:8b)
- Reduce maxTokens in requests
- Use quantized models

## Next Steps

1. **Explore the API**: Check `/docs/API.md` for full documentation
2. **Add More Providers**: See implementation plan for LM Studio, LocalAI
3. **Build a UI**: Create a frontend using the API
4. **Deploy**: See `/docs/DEPLOYMENT.md` for production setup

## Resources

- [API Documentation](docs/api-reference.md)
- [Character System](docs/character-system.md)
- [Performance Tuning](docs/performance-tuning.md)
- [Operations Guide](docs/operations-guide.md)
- [Local LLM Plan](docs/plans/local_llm_implementation_plan.md)
- [Ollama Models](https://ollama.com/library)

## Getting Help

- Check [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- Review logs: `tail -f api/logs/app.log`
- Enable debug mode: `LOG_LEVEL=debug npm run dev`

Happy generating! 🚀