# Flux Browser App

Local AI image generation using Flux Schnell through ComfyUI integration.

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults should work)
   ```

3. **Start everything**:
   ```bash
   ./start-all.sh
   ```

4. **Open the app**:
   - Navigate to http://localhost:3000

## Manual Startup

If you prefer to start services separately:

1. **Start ComfyUI**:
   ```bash
   cd /media/rese/AL/ComfyUI
   nohup python main.py --listen > comfyui_output.log 2>&1 &
   ```

2. **Start Flux App**:
   ```bash
   npm run dev
   ```

## Features

- Text-to-image generation using Flux Schnell
- Real-time progress updates
- Parameter controls (resolution, steps, seed)
- WebSocket-based live updates
- Automatic error recovery

## Requirements

- Node.js 18+
- Python 3.10+
- AMD/NVIDIA GPU with 12GB+ VRAM
- ComfyUI with Flux models installed

## Documentation

- [Setup Guide](docs/SETUP.md) - Detailed installation instructions
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [ComfyUI Integration](docs/COMFYUI_INTEGRATION.md) - Technical details
- [API Documentation](docs/API.md) - Backend API reference

## Common Issues

### Broken Pipe Error
Start ComfyUI with nohup as shown above.

### Generation Timeout
Flux generation takes 5-10 minutes. The timeout is set to 10 minutes.

### Port Conflicts
```bash
lsof -i :3001  # Check backend port
kill <PID>     # Kill conflicting process
```

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
npm run start
```

## License

[Your License Here]