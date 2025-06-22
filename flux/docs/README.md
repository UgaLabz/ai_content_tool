# Flux Content Generation Browser App

A comprehensive browser-based application for AI image generation using Flux models, supporting both local (Flux Schnell) and cloud-based (Flux API) generation capabilities.

## Overview

This application provides a modern, user-friendly interface for generating high-quality images using Black Forest Labs' Flux models. It supports both local generation using Flux Schnell for fast, offline creation, and cloud-based generation using the Flux API for access to premium models.

## Features

### Phase 1: Local Generation (Flux Schnell)
- 🚀 Fast local image generation (1-4 steps)
- 🎨 Advanced prompt engineering interface
- 🔧 Full parameter control (guidance, steps, seed)
- 📊 Real-time generation preview
- 🖼️ Image gallery with history
- 💾 Batch generation support
- 📱 Responsive mobile interface

### Phase 2: Cloud Generation (Flux API)
- ☁️ Access to Flux Pro and Ultra models
- 🎯 Advanced editing with Flux Kontext
- 🖌️ Inpainting and outpainting
- 🔄 Image-to-image generation
- 💳 Usage tracking and billing
- 🔐 Secure API key management
- 📈 Performance analytics

## Technology Stack

- **Frontend:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express/Fastify, ComfyUI integration
- **AI Models:** Flux Schnell (local), Flux Pro/Ultra/Kontext (API)
- **Real-time:** WebSocket with Socket.io
- **Storage:** Local file system, optional cloud storage

## Quick Start

```bash
# Clone the repository
git clone [repository-url]
cd flux

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Configure model paths
# Edit .env to point to /media/rese/AL/flux

# Start development server
npm run dev
```

## Project Structure

```
flux/
├── docs/               # Documentation
├── src/                # Source code
│   ├── app/           # Next.js app router
│   ├── components/    # React components
│   ├── lib/           # Utilities and helpers
│   ├── server/        # Backend services
│   └── types/         # TypeScript definitions
├── public/            # Static assets
├── tests/             # Test suites
└── models/            # Symlinks to /media/rese/AL
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Environment Variables

Copy `.env.example` to `.env` and update values:
```
# Model paths
MODEL_PATH=/media/rese/AL/flux
COMFYUI_PATH=/path/to/comfyui

# API Configuration
FLUX_API_KEY=your-api-key
FLUX_API_URL=https://api.bfl.ml/v1

# Server Configuration  
PORT=3000
NODE_ENV=development
```

## Documentation

- [Setup Guide](./SETUP.md) - Installation and configuration
- [Architecture](./ARCHITECTURE.md) - System design and structure
- [Features](./FEATURES.md) - Detailed feature documentation
- [API Integration](./API_INTEGRATION.md) - Flux API usage
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
- [Implementation Plan](./plans/init.md) - Development roadmap

## Model Storage

AI models are stored at `/media/rese/AL/flux/` to conserve space and allow sharing between projects.

## Development Status

Currently in active development. See [plans/init.md](./plans/init.md) for the detailed implementation roadmap.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a pull request

## License

[License information to be added]

---
Last updated: December 2024
*Built with ❤️ for the AI art community*