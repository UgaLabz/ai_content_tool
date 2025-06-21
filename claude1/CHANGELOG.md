# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive server management documentation (`docs/SERVER_MANAGEMENT.md`)
- Root-level package.json with unified npm scripts for easier project management
- Database cleanup functionality:
  - DELETE `/api/characters` endpoint for clearing all characters (development only)
  - `npm run clean:db` command to delete all characters
  - `npm run reset` command to stop servers, clean database, and restart
- API documentation for character management endpoints (`docs/API.md`)
- Character serializer utility for proper API response formatting

### Fixed
- Frontend character response mapper now handles incomplete API responses gracefully
- Fixed "Cannot read properties of undefined (reading 'traits')" error
- Added defensive programming to handle missing nested properties in character data

### Changed
- Updated character routes to include bulk delete functionality
- Improved error handling in frontend API client

## [1.0.0] - 2025-06-20

### Initial Release
- Character management system with full CRUD operations
- Web frontend with React and TypeScript
- RESTful API with Fastify
- Integration with multiple AI providers (OpenAI, Ollama, LocalAI, LM Studio)
- Character-based content generation
- Memory system for characters
- Intelligent orchestration layer for provider selection
- Comprehensive testing setup
- Documentation and troubleshooting guides