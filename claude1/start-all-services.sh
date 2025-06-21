#!/bin/bash

echo "=== Starting Complete Meme Generator System ==="
echo

# Function to check service
check_service() {
    local name=$1
    local port=$2
    if nc -z localhost $port 2>/dev/null; then
        echo "✓ $name is running on port $port"
        return 0
    else
        echo "✗ $name is not running on port $port"
        return 1
    fi
}

# 1. Start ComfyUI for AI image generation
echo "1. Starting ComfyUI with AMD GPU support..."
if ! check_service "ComfyUI" 8188; then
    cd ~/ComfyUI
    if [ -f "run_amd.sh" ]; then
        echo "Starting ComfyUI..."
        nohup ./run_amd.sh > ~/comfyui.log 2>&1 &
        sleep 10
    else
        echo "ComfyUI run script not found. Starting with basic command..."
        export HSA_OVERRIDE_GFX_VERSION=10.3.0
        export ROCR_VISIBLE_DEVICES=0
        source venv/bin/activate
        nohup python main.py --listen 0.0.0.0 --port 8188 > ~/comfyui.log 2>&1 &
        sleep 10
    fi
    
    if check_service "ComfyUI" 8188; then
        echo "✓ ComfyUI started successfully!"
    else
        echo "✗ ComfyUI failed to start. Check ~/comfyui.log"
    fi
fi

# 2. Start Ollama with GPU support
echo
echo "2. Starting Ollama with AMD GPU support..."
if ! check_service "Ollama" 11434; then
    # Kill any existing Ollama
    sudo pkill ollama 2>/dev/null
    sleep 2
    
    # Start with GPU environment
    export HSA_OVERRIDE_GFX_VERSION=10.3.0
    export ROCR_VISIBLE_DEVICES=0
    nohup ollama serve > ~/ollama.log 2>&1 &
    sleep 5
    
    check_service "Ollama" 11434
fi

# 3. Start API with relaxed TypeScript
echo
echo "3. Starting API server..."
if ! check_service "API" 3000; then
    cd /home/rese/Documents/ai_content_tool/claude/api
    
    # Kill any stuck processes
    pkill -f "tsx.*index.ts" 2>/dev/null
    sleep 2
    
    # Start with transpile-only mode
    export TS_NODE_TRANSPILE_ONLY=true
    export NODE_ENV=development
    export COMFYUI_URL=http://localhost:8188
    
    nohup npx tsx src/index.ts > api.log 2>&1 &
    sleep 5
    
    check_service "API" 3000
fi

# 4. Check frontend
echo
echo "4. Checking web frontend..."
if ! check_service "Frontend" 5173; then
    cd /home/rese/Documents/ai_content_tool/claude/web
    nohup npm run dev > web.log 2>&1 &
    sleep 5
fi

# Final status
echo
echo "=== FINAL STATUS ==="
check_service "ComfyUI (AI Images)" 8188
check_service "Ollama (Text Gen)" 11434
check_service "API Server" 3000
check_service "Web Frontend" 5173

echo
echo "=== ACCESS POINTS ==="
echo "🌐 Web App: http://localhost:5173"
echo "🤖 ComfyUI: http://localhost:8188"
echo "📝 API Docs: http://localhost:3000/docs"

echo
echo "=== MONITORING ==="
echo "GPU Usage: watch -n 1 rocm-smi"
echo "ComfyUI Logs: tail -f ~/comfyui.log"
echo "API Logs: tail -f ~/Documents/ai_content_tool/claude/api/api.log"

echo
echo "=== USAGE ==="
echo "1. Open http://localhost:5173 in your browser"
echo "2. Select your Luddite character"
echo "3. Click 'Generate Content'"
echo "4. Type your meme idea and click Generate"
echo "5. With ComfyUI running, you'll get AI-generated meme images!"

echo
echo "If you see any errors, check the logs above."