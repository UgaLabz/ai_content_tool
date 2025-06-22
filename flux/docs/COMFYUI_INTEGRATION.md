# ComfyUI Integration Documentation

This document describes how the Flux Browser app integrates with ComfyUI for local image generation.

## Overview

ComfyUI serves as the backend engine for running Flux models locally. The integration uses:
- HTTP API for submitting workflows
- WebSocket for real-time progress updates
- Custom workflow templates for Flux models

## Architecture

```
Flux Browser App
     │
     ├── API Client (Frontend)
     │   └── Socket.io Client
     │
     ├── Express Server (Backend)
     │   ├── REST API Endpoints
     │   ├── Socket.io Server
     │   └── ComfyUI Client
     │
     └── ComfyUI Server
         ├── Workflow Execution
         ├── Model Loading
         └── Image Generation
```

## ComfyUI Setup

### Installation Path
ComfyUI is expected to be installed at `/media/rese/AL/ComfyUI/`

### Starting ComfyUI Properly

To avoid broken pipe errors that occur during model execution, start ComfyUI with output redirection:

```bash
cd /media/rese/AL/ComfyUI
nohup python main.py --listen > comfyui_output.log 2>&1 &
```

The `--listen` flag is important as it allows external connections on all interfaces (0.0.0.0:8188).

### Configuration
ComfyUI should be configured to:
- Listen on all interfaces (0.0.0.0:8188)
- Have Flux models available in the correct paths
- Support WebSocket connections

## API Integration

### ComfyUI Client Service
Location: `src/server/services/comfyui-client.ts`

Key features:
- WebSocket connection management
- Workflow template processing
- Queue management
- Progress tracking
- Error handling
- Extended timeout for Flux generation (10 minutes)

### Workflow Template
Location: `src/server/workflows/flux-schnell-workflow-template.json`

The workflow template defines:
- Model loading (UNET, CLIP, VAE)
- Text encoding pipeline
- Sampling parameters
- Image saving

Template structure:
```json
{
  "version": "1.0",
  "nodes": {
    "6": { /* CLIP Text Encode */ },
    "8": { /* VAE Decode */ },
    "9": { /* Save Image */ },
    "10": { /* VAE Loader */ },
    "11": { /* Dual CLIP Loader */ },
    "12": { /* UNET Loader */ },
    "13": { /* Sampler */ },
    // ... other nodes
  }
}
```

**Important**: The workflow template uses a nested structure with a "nodes" object, but ComfyUI expects nodes at the root level. The `prepareWorkflow` method extracts just the nodes object before submission.

### Dynamic Parameters

The workflow template supports these parameters:
- `prompt` - User's text prompt
- `width` - Image width (default: 1024)
- `height` - Image height (default: 1024)
- `steps` - Number of sampling steps (default: 4)
- `seed` - Random seed (auto-generated if not provided)
- `sampler` - Sampling method (default: 'euler')
- `scheduler` - Scheduler type (default: 'simple')

## API Endpoints

### POST /api/generate
Generate an image with specified parameters.

Request:
```json
{
  "prompt": "a beautiful sunset",
  "width": 1024,
  "height": 1024,
  "steps": 4,
  "seed": 12345,
  "sampler": "euler",
  "scheduler": "simple"
}
```

Response:
```json
{
  "success": true,
  "id": "generation-uuid",
  "url": "http://localhost:8188/view?filename=...",
  "params": { ... }
}
```

### GET /api/status/:id
Get the status of a generation.

Response:
```json
{
  "id": "generation-uuid",
  "status": "processing",
  "progress": 50,
  "result": null,
  "error": null
}
```

### POST /api/cancel/:id
Cancel an ongoing generation.

### GET /api/system
Get ComfyUI system statistics including GPU info.

## WebSocket Events

### Client → Server
- `connection` - Initial connection
- `disconnect` - Client disconnect

### Server → Client
- `generation:start` - Generation started
- `generation:progress` - Progress update
- `generation:complete` - Generation finished
- `generation:error` - Generation failed
- `generation:cancelled` - Generation cancelled

## WebSocket Message Handling

The ComfyUI client handles these WebSocket message types:

1. **status** - Queue status updates
2. **execution_start** - Workflow execution begins
3. **execution_cached** - Cached nodes identified
4. **executing** - Node execution updates
5. **executed** - Node completion with outputs
6. **progress** - Progress updates during sampling
7. **execution_error** - Error during execution
8. **execution_success** - Workflow completed successfully

### Critical Message Flow

1. Workflow submitted → `execution_start`
2. Each node executes → `executing` messages
3. Sampling progress → `progress` messages
4. Image saved → `executed` message for SaveImage node
5. Completion → `execution_success` message

## Error Handling

### Common Errors and Solutions

1. **Broken Pipe Error**
   - **Cause**: ComfyUI's stdout/stderr gets disconnected during long operations
   - **Solution**: Start ComfyUI with `nohup` and output redirection
   - **Example**: `nohup python main.py --listen > comfyui_output.log 2>&1 &`

2. **Generation Timeout**
   - **Cause**: Flux generation takes 5-10 minutes, exceeding default timeout
   - **Solution**: Timeout increased to 10 minutes (600000ms)
   - **Monitor**: Check ComfyUI logs for actual progress

3. **Out of Memory**
   - **Cause**: GPU runs out of VRAM during generation
   - **Solution**: ComfyUI automatically falls back to tiled VAE decoding
   - **Prevention**: Use FP8 models, reduce image size

4. **WebSocket Disconnection**
   - Automatic reconnection with exponential backoff
   - Maximum 5 retry attempts
   - 5-second initial retry delay

## Performance Considerations

### Model Loading
- Models are loaded once and kept in memory
- FP8 quantization reduces memory usage by ~50%
- Flux Schnell uses ~12GB VRAM with FP8

### Generation Time
- Flux Schnell: 4 steps, ~5-10 minutes per image
- Sampling: ~40 seconds (10s per step)
- VAE Decoding: ~4-5 minutes (may use tiled mode)
- Total: ~5-10 minutes depending on GPU

### Memory Management
- Automatic tiled VAE decoding when OOM
- FP8 models recommended for <16GB VRAM
- 1024x1024 is optimal resolution

## Testing

### Test ComfyUI Connection
```bash
# Check if ComfyUI is running
curl http://localhost:8188/system_stats

# Test workflow submission
curl -X POST http://localhost:8188/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": {}, "client_id": "test"}'
```

### Monitor Generation Progress
```bash
# Watch ComfyUI logs
tail -f /media/rese/AL/ComfyUI/comfyui_output.log

# Watch backend logs
tail -f server.log
```

## Troubleshooting

### Debug Workflow Issues
1. Enable debug logging in comfyui-client.ts
2. Check WebSocket message flow
3. Verify workflow JSON structure
4. Monitor ComfyUI console output

### Common Workflow Errors
- Missing models → Check model paths
- Invalid node connections → Verify workflow template
- Type mismatches → Check parameter types

## Future Enhancements

1. **Batch Processing**
   - Generate multiple images in one request
   - Queue management improvements

2. **Advanced Features**
   - ControlNet integration
   - Image-to-image generation
   - Inpainting/outpainting

3. **Performance**
   - Model caching strategies
   - Multi-GPU support
   - Queue prioritization

---

*Last updated: January 2025*