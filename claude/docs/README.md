# AI-Powered Character-Driven Content Generator

A sophisticated content generation platform that combines multiple AI services (both cloud-based and local) to create character-driven narratives, images, and videos through a unified natural language interface.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Project Structure

```
api/
├── src/
│   ├── services/     # AI service integrations
│   │   ├── openai/   # OpenAI GPT-4 & DALL-E
│   │   ├── local/    # Local LLM integrations
│   │   └── hybrid/   # Orchestration layer
│   ├── controllers/  # API endpoints
│   └── models/       # Data models
├── tests/            # Test suites
└── config/           # Configuration files

cli/
├── src/
│   ├── commands/     # CLI commands
│   └── repl.ts       # Interactive mode

docs/
├── plans/            # Implementation plans
│   ├── claude_plan.md
│   └── local_llm_implementation_plan.md
└── *.md              # Documentation files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests

## Features

- **Multi-AI Integration**: Supports OpenAI, Claude, and local LLMs (Ollama, LM Studio, LocalAI)
- **Character Management**: Create and maintain consistent character personalities
- **Content Pipeline**: Generate text, images, and videos through natural language
- **Hybrid Architecture**: Intelligent routing between local and cloud AI services
- **Privacy First**: Run entirely offline with local models
- **Cost Optimization**: Automatic selection of most cost-effective provider

## Local LLM Support

This project supports running Large Language Models locally for privacy, cost savings, and offline capabilities. See our [Local LLM Implementation Plan](plans/local_llm_implementation_plan.md) for detailed setup instructions.

### Supported Local LLM Runtimes:
- **Ollama**: Command-line focused, easy API integration
- **LM Studio**: GUI-based with TypeScript SDK
- **LocalAI**: OpenAI-compatible API drop-in replacement

## Environment Variables

Copy `.env.example` to `.env` and update values:
```
# Cloud AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-claude-key

# Local LLM Configuration
OLLAMA_HOST=http://localhost:11434
LMSTUDIO_HOST=http://localhost:1234
LOCALAI_HOST=http://localhost:8080

# Database
DATABASE_URL=postgresql://user:pass@localhost/content_db
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Local LLM Implementation Plan](plans/local_llm_implementation_plan.md)
- [Original Claude Integration Plan](plans/claude_plan.md)
- [Security Guide](SECURITY.md)
- [Deployment Guide](DEPLOYMENT.md)

---
Last updated: 2025-01-19