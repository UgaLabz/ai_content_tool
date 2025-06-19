# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- LM Studio integration with official TypeScript SDK
- Auto-discovery of LM Studio server
- Model management for LM Studio (list, load, unload)
- WebSocket-based communication with LM Studio
- Setup script and documentation for LM Studio
- Tests for LM Studio service

### In Progress
- Phase 4: LocalAI OpenAI-compatible integration
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