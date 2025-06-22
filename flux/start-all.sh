#!/bin/bash
# Flux Browser App - Full Startup Script

echo "🚀 Starting Flux Browser App..."

# Check if ComfyUI is already running
if pgrep -f "python.*main.py.*listen" > /dev/null; then
    echo "✓ ComfyUI is already running"
else
    echo "Starting ComfyUI..."
    cd /media/rese/AL/ComfyUI
    nohup python main.py --listen > comfyui_output.log 2>&1 &
    echo "Waiting for ComfyUI to initialize..."
    sleep 10
    
    # Check if ComfyUI started successfully
    if curl -s http://localhost:8188/system_stats > /dev/null; then
        echo "✓ ComfyUI started successfully"
    else
        echo "❌ Failed to start ComfyUI. Check logs at /media/rese/AL/ComfyUI/comfyui_output.log"
        exit 1
    fi
fi

# Return to flux directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Kill any existing backend/frontend processes
echo "Cleaning up old processes..."
pkill -f "tsx.*server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start the Flux app
echo "Starting Flux Browser App..."
npm run dev

echo "
✅ Flux Browser App is ready!
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - ComfyUI: http://localhost:8188

To stop all services:
   pkill -f 'python.*main.py'
   pkill -f 'tsx'
   pkill -f 'next'
"