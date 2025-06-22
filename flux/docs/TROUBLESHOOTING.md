# Troubleshooting Guide

This guide helps resolve common issues with the Flux Browser application.

## Table of Contents

1. [ComfyUI Issues](#comfyui-issues)
2. [Backend Issues](#backend-issues)
3. [Frontend Issues](#frontend-issues)
4. [Performance Issues](#performance-issues)
5. [Model Issues](#model-issues)

## ComfyUI Issues

### Broken Pipe Error

**Symptoms**:
```
BrokenPipeError: [Errno 32] Broken pipe
File "/media/rese/AL/ComfyUI/app/logger.py", line 35, in flush
```

**Cause**: ComfyUI's stdout/stderr gets disconnected during long operations, especially during VAE decoding.

**Solution**:
Start ComfyUI with output redirection:
```bash
cd /media/rese/AL/ComfyUI
nohup python main.py --listen > comfyui_output.log 2>&1 &
```

### ComfyUI Not Starting

**Symptoms**:
- "Failed to connect to ComfyUI"
- WebSocket connection errors

**Solutions**:
1. Check if ComfyUI is running:
   ```bash
   ps aux | grep "python.*main.py"
   curl http://localhost:8188/system_stats
   ```

2. Check ComfyUI logs:
   ```bash
   tail -f /media/rese/AL/ComfyUI/comfyui_output.log
   ```

3. Ensure port 8188 is not blocked:
   ```bash
   sudo ufw allow 8188
   ```

### WebSocket Connection Failed

**Symptoms**:
- "WebSocket error: Error: connect ECONNREFUSED"
- Connection timeouts

**Solutions**:
1. Verify ComfyUI is started with `--listen` flag
2. Check COMFYUI_URL in .env file
3. Ensure no firewall blocking

## Backend Issues

### Generation Timeout

**Symptoms**:
- "Error: Generation timeout" after 2 minutes
- Image generates successfully but frontend shows error

**Cause**: Flux generation takes 5-10 minutes but default timeout was 2 minutes.

**Solution**: Already fixed in code - timeout is now 10 minutes. If still timing out:
1. Check GPU performance
2. Monitor ComfyUI logs for actual progress
3. Consider reducing image resolution

### Workflow Template Errors

**Symptoms**:
```
TypeError: Cannot read properties of undefined (reading 'inputs')
```

**Cause**: Workflow template structure mismatch.

**Solution**: Already fixed - the workflow template's nested "nodes" object is now properly extracted.

### Port Already in Use

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions**:
```bash
# Find process using port
lsof -i :3001

# Kill specific process
kill <PID>

# Or kill all Node processes (careful!)
pkill -f "node"
```

## Frontend Issues

### Socket.io Connection Issues

**Symptoms**:
- Real-time updates not working
- Progress bar stuck

**Solutions**:
1. Check browser console for errors
2. Verify backend is running on port 3001
3. Clear browser cache
4. Check for CORS issues

### Images Not Displaying

**Symptoms**:
- Generated images show broken link
- 404 errors for image URLs

**Solutions**:
1. Verify ComfyUI is serving images
2. Check image URL format
3. Ensure ComfyUI output directory exists

## Performance Issues

### Out of Memory Errors

**Symptoms**:
```
Warning: Ran out of memory when regular VAE decoding, retrying with tiled VAE decoding
```

**Solutions**:
1. Use FP8 models instead of FP16
2. Reduce image resolution
3. Close other GPU applications
4. Monitor GPU memory:
   ```bash
   watch -n 1 nvidia-smi  # For NVIDIA
   watch -n 1 rocm-smi    # For AMD
   ```

### Slow Generation

**Symptoms**:
- Generation takes >10 minutes
- Progress updates very slowly

**Solutions**:
1. Check GPU utilization
2. Ensure using FP8 models
3. Verify no CPU fallback
4. Check thermal throttling

### Memory Leaks

**Symptoms**:
- Memory usage grows over time
- System becomes unresponsive

**Solutions**:
1. Restart ComfyUI periodically
2. Monitor with:
   ```bash
   htop
   # Look for python and node processes
   ```

## Model Issues

### Missing Models

**Symptoms**:
- "Could not find model" errors
- Workflow fails at model loading nodes

**Solutions**:
1. Verify model files exist:
   ```bash
   ls -la /media/rese/AL/ComfyUI/models/unet/
   ls -la /media/rese/AL/ComfyUI/models/clip/
   ls -la /media/rese/AL/ComfyUI/models/vae/
   ```

2. Check file permissions:
   ```bash
   chmod 644 /media/rese/AL/ComfyUI/models/*/*.safetensors
   ```

3. Verify model names in workflow match files

### Corrupt Model Files

**Symptoms**:
- "Invalid model file" errors
- Unexpected model loading failures

**Solutions**:
1. Verify file integrity with checksums
2. Re-download affected models
3. Check disk space during download

## Debug Commands

### Check All Services

```bash
# ComfyUI status
ps aux | grep "python.*main.py" | grep -v grep

# Backend status
ps aux | grep "tsx.*server" | grep -v grep

# Frontend status
ps aux | grep "next" | grep -v grep

# Check all ports
netstat -tlnp | grep -E "(3000|3001|8188)"
```

### View All Logs

```bash
# ComfyUI logs
tail -f /media/rese/AL/ComfyUI/comfyui_output.log

# Backend logs
tail -f server.log

# Watch both
tail -f /media/rese/AL/ComfyUI/comfyui_output.log server.log
```

### Test Endpoints

```bash
# Test ComfyUI
curl http://localhost:8188/system_stats

# Test backend
curl http://localhost:3001/api/health

# Test generation
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test image"}'
```

## Emergency Recovery

If everything is broken:

1. **Stop all services**:
   ```bash
   pkill -f "python.*main.py"
   pkill -f "tsx"
   pkill -f "next"
   ```

2. **Clear temporary files**:
   ```bash
   rm -f server.log
   rm -f comfyui_output.log
   rm -f nohup.out
   ```

3. **Restart ComfyUI**:
   ```bash
   cd /media/rese/AL/ComfyUI
   nohup python main.py --listen > comfyui_output.log 2>&1 &
   ```

4. **Wait for initialization** (check logs)

5. **Restart Flux app**:
   ```bash
   cd /path/to/flux
   npm run dev
   ```

## Getting Help

If issues persist:

1. Check the [GitHub Issues](https://github.com/[repo]/issues)
2. Review recent changes in [CHANGELOG.md](./CHANGELOG.md)
3. Enable debug logging in affected components
4. Collect logs and system info for bug reports

---

*Last updated: January 2025*