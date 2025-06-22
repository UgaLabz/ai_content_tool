# Flux Browser App - Setup Guide

This guide will help you set up the Flux Browser application for local image generation with ComfyUI.

## Prerequisites

- Node.js 18.17 or later
- npm package manager
- Git
- Python 3.10+ (for ComfyUI)
- AMD/NVIDIA GPU with 12GB+ VRAM
- 20GB+ free disk space
- ComfyUI installation (required)

## Installation

### 1. Clone the Repository

```bash
git clone [repository-url]
cd flux
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
# ComfyUI Configuration
COMFYUI_URL=http://localhost:8188

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 4. ComfyUI Setup

ComfyUI must be installed at `/media/rese/AL/ComfyUI/` with the Flux models properly configured.

#### Starting ComfyUI

To prevent broken pipe errors, start ComfyUI with output redirection:

```bash
cd /media/rese/AL/ComfyUI
nohup python main.py --listen > comfyui_output.log 2>&1 &
```

This runs ComfyUI in the background with proper output handling.

#### Verify ComfyUI is Running

```bash
# Check if ComfyUI is running
curl http://localhost:8188/system_stats

# View ComfyUI logs
tail -f /media/rese/AL/ComfyUI/comfyui_output.log
```

### 5. Model Requirements

The following models must be available in ComfyUI's model directories:

1. **Flux Schnell Model**
   - Location: `/media/rese/AL/ComfyUI/models/unet/flux1-schnell.safetensors`
   - Size: ~12GB (FP8 version recommended)

2. **CLIP Models**
   - `clip_l.safetensors` in `/media/rese/AL/ComfyUI/models/clip/`
   - `t5xxl_fp8_e4m3fn.safetensors` in `/media/rese/AL/ComfyUI/models/clip/`

3. **VAE Model**
   - `ae.safetensors` in `/media/rese/AL/ComfyUI/models/vae/`

### 6. Starting the Application

#### Development Mode

Start both the Next.js frontend and Express backend:

```bash
npm run dev
```

This runs:
- Next.js frontend on `http://localhost:3000`
- Express backend on `http://localhost:3001`

#### Production Mode

```bash
npm run build
npm run start
```

## Full Startup Process

1. **Start ComfyUI** (if not already running):
   ```bash
   cd /media/rese/AL/ComfyUI
   nohup python main.py --listen > comfyui_output.log 2>&1 &
   ```

2. **Wait for ComfyUI to Initialize** (check logs):
   ```bash
   tail -f /media/rese/AL/ComfyUI/comfyui_output.log
   # Look for "To see the GUI go to: http://0.0.0.0:8188"
   ```

3. **Start the Flux App**:
   ```bash
   cd /path/to/flux
   npm run dev
   ```

4. **Open the Application**:
   - Navigate to `http://localhost:3000`
   - The app will automatically connect to ComfyUI

## Project Structure

```
flux/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── ui/          # UI components
│   │   └── hooks/       # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── server/          # Express backend
│   │   ├── services/    # ComfyUI client service
│   │   ├── workflows/   # ComfyUI workflow templates
│   │   └── index.ts     # Express server entry
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
├── docs/               # Documentation
└── .env                # Environment configuration
```

## Troubleshooting

### ComfyUI Connection Issues

1. **WebSocket Connection Failed**
   - Ensure ComfyUI is running with `--listen` flag
   - Check that port 8188 is not blocked
   - Verify COMFYUI_URL in .env

2. **Broken Pipe Error**
   - Restart ComfyUI with nohup as shown above
   - This prevents stdout/stderr issues

3. **Generation Timeout**
   - Flux generation can take 5-10 minutes
   - The timeout is set to 10 minutes
   - Check ComfyUI logs for actual errors

### Memory Issues

1. **Out of Memory During Generation**
   - Use FP8 models instead of FP16
   - ComfyUI will automatically use tiled VAE decoding if needed
   - Reduce image resolution (512x512 for testing)

2. **Model Loading Issues**
   - Verify all model files are present
   - Check file permissions
   - Ensure sufficient disk space

### Backend Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 3001
   lsof -i :3001
   # Kill the process
   kill <PID>
   ```

2. **TypeScript Compilation Errors**
   ```bash
   # Check for TypeScript errors
   npx tsc --noEmit
   ```

## Development Tips

1. **Monitor All Logs**:
   ```bash
   # ComfyUI logs
   tail -f /media/rese/AL/ComfyUI/comfyui_output.log
   
   # Backend logs
   tail -f server.log
   ```

2. **Test ComfyUI Directly**:
   ```bash
   # Test workflow submission
   curl -X POST http://localhost:8188/prompt \
     -H "Content-Type: application/json" \
     -d @src/server/workflows/flux-schnell-workflow-template.json
   ```

3. **WebSocket Debugging**:
   - Backend WebSocket messages are logged to console
   - Check browser DevTools for frontend WebSocket activity

## Next Steps

- See [COMFYUI_INTEGRATION.md](./COMFYUI_INTEGRATION.md) for integration details
- Check [API.md](./API.md) for API documentation
- Read [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more solutions

---

*Last updated: January 2025*