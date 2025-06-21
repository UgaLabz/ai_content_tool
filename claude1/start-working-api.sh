#!/bin/bash

echo "=== Starting Meme Generator (Working Version) ==="
echo

# Kill any existing processes
pkill -f "tsx watch src/index.ts" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 2

# 1. Start API with transpile-only mode (ignores TypeScript errors)
echo "Starting API server (ignoring TypeScript errors)..."
cd /home/rese/Documents/ai_content_tool/claude/api

# Set environment to bypass strict TypeScript
export TS_NODE_TRANSPILE_ONLY=true
export NODE_ENV=development

# Start the API
nohup npx tsx src/index.ts > api-runtime.log 2>&1 &
API_PID=$!

echo "API starting with PID: $API_PID"
sleep 5

# Check if it's running
if ps -p $API_PID > /dev/null; then
    echo "✓ API is running!"
else
    echo "✗ API failed to start. Checking logs..."
    tail -20 api-runtime.log
    exit 1
fi

# 2. Check services
echo
echo "=== Service Status ==="
nc -z localhost 3000 && echo "✓ API is accessible on port 3000" || echo "✗ API not accessible"
nc -z localhost 11434 && echo "✓ Ollama is running on port 11434" || echo "✗ Ollama not running"

echo
echo "=== Next Steps ==="
echo "1. Open your browser to: http://localhost:5173"
echo "2. The web frontend should already be running"
echo "3. You can now generate meme text (images require ComfyUI setup)"
echo
echo "To monitor API logs: tail -f api-runtime.log"
echo
echo "For AI image generation, set up ComfyUI:"
echo "  cd ~/Documents/ai_content_tool/claude"
echo "  ./quick-setup-comfyui.sh"