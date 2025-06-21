#!/bin/bash

echo "=== Starting AI Meme Generator System ==="
echo

# Function to check if service is running
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

# 1. Start Ollama with GPU support
echo "1. Starting Ollama with AMD GPU support..."
if ! check_service "Ollama" 11434; then
    sudo pkill ollama 2>/dev/null
    sleep 2
    
    # Start Ollama with AMD GPU environment
    export HSA_OVERRIDE_GFX_VERSION=10.3.0
    export ROCR_VISIBLE_DEVICES=0
    export HIP_VISIBLE_DEVICES=0
    
    echo "Starting Ollama..."
    nohup ollama serve > ~/ollama-gpu.log 2>&1 &
    sleep 5
    
    if check_service "Ollama" 11434; then
        echo "Ollama started successfully!"
    else
        echo "Failed to start Ollama. Check ~/ollama-gpu.log"
    fi
fi

# 2. Start API server
echo
echo "2. Starting API server..."
if ! check_service "API" 3000; then
    # Kill existing processes
    pkill -f "tsx watch src/index.ts" 2>/dev/null
    sleep 2
    
    # Start API
    cd /home/rese/Documents/ai_content_tool/claude/api
    
    # Install dependencies if needed
    if [ ! -d "node_modules/canvas" ]; then
        echo "Installing missing dependencies..."
        npm install axios canvas
    fi
    
    echo "Starting API server..."
    nohup npm run dev > api.log 2>&1 &
    sleep 5
    
    if check_service "API" 3000; then
        echo "API started successfully!"
    else
        echo "Failed to start API. Check /home/rese/Documents/ai_content_tool/claude/api/api.log"
    fi
fi

# 3. Start web frontend
echo
echo "3. Starting web frontend..."
if ! check_service "Frontend" 5173; then
    cd /home/rese/Documents/ai_content_tool/claude/web
    echo "Starting frontend..."
    nohup npm run dev > web.log 2>&1 &
    sleep 5
    
    if check_service "Frontend" 5173; then
        echo "Frontend started successfully!"
    else
        echo "Failed to start frontend. Check /home/rese/Documents/ai_content_tool/claude/web/web.log"
    fi
fi

# 4. Check for ComfyUI (optional)
echo
echo "4. Checking for AI image generation..."
if check_service "ComfyUI" 8188; then
    echo "ComfyUI is available for AI image generation!"
else
    echo "ComfyUI not running. For AI-generated meme images:"
    echo "  cd ~/ComfyUI && ./run_amd.sh"
fi

echo
echo "=== System Status ==="
check_service "Ollama" 11434
check_service "API" 3000
check_service "Frontend" 5173
check_service "ComfyUI" 8188

echo
echo "=== Access Points ==="
echo "Web Interface: http://localhost:5173"
echo "API: http://localhost:3000"
echo "Ollama: http://localhost:11434"
echo "ComfyUI (if running): http://localhost:8188"

echo
echo "=== Monitoring ==="
echo "GPU usage: watch -n 1 rocm-smi"
echo "API logs: tail -f /home/rese/Documents/ai_content_tool/claude/api/api.log"
echo "Ollama logs: tail -f ~/ollama-gpu.log"

echo
echo "To stop all services: pkill ollama; pkill node; pkill npm"