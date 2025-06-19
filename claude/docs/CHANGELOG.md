# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- LocalAI integration as OpenAI-compatible local inference server
  - Full OpenAI API compatibility using official SDK
  - Multi-modal support: text, images, speech (TTS/STT), embeddings
  - Docker Compose configuration for easy deployment
  - Model gallery integration for automatic model downloads
  - Support for multiple backends (llama.cpp, stable diffusion, whisper)
- LM Studio integration with official TypeScript SDK
  - Auto-discovery of LM Studio server
  - Model management (list, load, unload)
  - WebSocket-based communication
  - Function calling and vision support capabilities
- Setup scripts and documentation for all local providers
- Comprehensive test suites for all services
- Intelligence Layer for Phase 5: Hybrid Orchestrator
  - Task complexity analyzer with multi-factor scoring
  - Model capability matcher for optimal provider selection
  - Cost optimization engine with budget tracking
  - Performance predictor with historical learning
  - Real-time resource monitoring (CPU, memory, GPU)
  - Intelligent routing based on task requirements
  - Intelligence report endpoint at /api/intelligence/report
- Configuration System for dynamic orchestrator control
  - JSON-based configuration with hot-reloading
  - Provider preferences with conditions and priorities
  - Routing rules engine with pattern matching
  - Cost limits and performance thresholds
  - Privacy settings (strict/balanced/permissive modes)
  - Configuration API endpoints for runtime updates
  - Rule evaluation and validation system
- Comprehensive documentation
  - Hybrid architecture guide with diagrams
  - Configuration guide with examples and best practices
  - API documentation for all configuration endpoints

### Completed
- Phase 1-5: Foundation through Hybrid Orchestrator ✅

### In Progress
- Phase 6: Character system adaptation
- Phase 7: Performance optimization
- Phase 8: Production deployment

## [0.2.0] - 2025-01-19

### Added
- Complete API server implementation with Fastify and TypeScript
- Ollama service integration with full model management
- Hybrid orchestrator for intelligent provider selection
- RESTful API endpoints for text generation, chat, and model management
- Streaming support with Server-Sent Events
- Provider health monitoring and benchmarking
- Comprehensive API documentation
- Jest testing framework with unit tests
- CLI project structure (implementation pending)
- Ollama setup script for easy installation

### Technical Stack
- Node.js 20+ with TypeScript 5.8
- Fastify web framework
- Ollama NPM package for local LLM integration
- Zod for request validation
- Pino for structured logging
- Jest for testing

## [0.1.0] - 2025-01-19

### Added
- Initial project structure and documentation framework
- Original Claude integration plan for content generation
- Basic documentation templates (API, Architecture, Security, etc.)

---

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)