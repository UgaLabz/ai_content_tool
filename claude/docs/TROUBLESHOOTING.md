# Troubleshooting Guide

This guide helps you resolve common issues with the AI Content Tool.

## Common Issues

### 🔴 API Server Issues

#### Port 3000 Already in Use
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or kill all Node processes on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

#### API Not Starting
Check the logs for specific errors:
```bash
cd claude/api
npm run dev
```

Common causes:
- Missing `.env` file
- Ollama not running
- Dependencies not installed

### 🔴 Frontend Issues

#### Port 5173 Already in Use
```bash
# Find and kill process
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

#### Network Connection Failed
```
Error: Network connection failed
GET http://localhost:3000/api/characters net::ERR_CONNECTION_REFUSED
```

**Solutions:**
1. Ensure API server is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Check CORS configuration in API
3. Verify `VITE_API_URL` in frontend `.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

#### Characters Not Loading
If characters appear as empty objects:

1. Restart the API server
2. Check character files exist:
   ```bash
   ls claude/api/data/characters/profiles/
   ```
3. Verify character serialization is working

### 🔴 Dark Mode Issues

#### Black Text on Black Background
- Clear browser cache
- Toggle theme using the sun/moon icon in header
- Check CSS variables are loading properly

#### Sliders Not Visible
- Ensure Radix UI components are installed:
  ```bash
  cd claude/web
  npm install @radix-ui/react-slider
  ```

### 🔴 Character Creation Issues

#### Form Data Not Saving
- Check browser console for errors
- Ensure all required fields are filled
- Verify API is accepting POST requests

#### Avatar Upload Failing
- Check image size (max 100KB after compression)
- Ensure image format is supported (JPG, PNG)
- Verify base64 encoding

### 🔴 Ollama Issues

#### Ollama Not Responding
```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Start Ollama if not running
ollama serve

# Pull required model
ollama pull llama3.1:8b
```

#### Model Not Found
```bash
# List available models
ollama list

# Pull the default model
ollama pull llama3.1:8b
```

### 🔴 Build Issues

#### Vite Build Failing
```bash
# Clear cache and reinstall
cd claude/web
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### TypeScript Errors
```bash
# Check for type errors
npm run typecheck

# Fix linting issues
npm run lint:fix
```

## Debugging Tools

### Enable Debug Mode

1. **Frontend Debug Mode:**
   ```env
   VITE_ENABLE_DEBUG=true
   ```

2. **API Debug Mode:**
   ```env
   LOG_LEVEL=debug
   ```

### Check Running Processes
```bash
# All Node processes
ps aux | grep node

# Specific ports
netstat -tulpn | grep -E "(3000|5173)"
```

### View Logs

#### API Logs
```bash
# If running with nohup
tail -f claude/api/api.log

# If running in terminal
# Logs appear directly in terminal
```

#### Frontend Logs
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### Clean Restart

If nothing else works, try a clean restart:

```bash
# 1. Stop all services
pkill -f node

# 2. Clear temporary files
rm -rf claude/web/node_modules/.vite
rm -rf claude/api/dist

# 3. Reinstall dependencies
cd claude/api && npm install
cd ../web && npm install

# 4. Start services
# Terminal 1
cd claude/api && npm run dev

# Terminal 2
cd claude/web && npm run dev
```

## Performance Issues

### Slow Response Times
1. Check system resources:
   ```bash
   top
   free -h
   ```

2. Verify Ollama has enough memory:
   ```bash
   # Set Ollama memory limit
   export OLLAMA_MAX_LOADED_MODELS=1
   export OLLAMA_NUM_PARALLEL=1
   ```

3. Check API performance metrics:
   ```
   http://localhost:3000/api/performance/stats
   ```

### High Memory Usage
- Restart Ollama to clear model cache
- Reduce concurrent request handling
- Enable request queuing in API

## Getting Help

If you're still experiencing issues:

1. Check existing [GitHub Issues](https://github.com/yourusername/ai_content_tool/issues)
2. Search error messages in documentation
3. Create a new issue with:
   - Error messages
   - Steps to reproduce
   - System information
   - Relevant logs

## Quick Reference

### Health Checks
```bash
# API Health
curl http://localhost:3000/health

# Ollama Health
curl http://localhost:11434/api/version

# Character API
curl http://localhost:3000/api/characters
```

### Process Management
```bash
# Stop frontend
pkill -f "node.*vite"

# Stop backend
pkill -f "tsx watch"

# Stop Ollama
pkill ollama
```

### Common Ports
- Frontend: 5173
- API: 3000
- Ollama: 11434
- LocalAI: 8080
- LM Studio: 1234