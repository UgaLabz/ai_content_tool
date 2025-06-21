#!/bin/bash

# Simple Image Generator Startup Script
# Ensures ComfyUI is running before starting the GUI

echo "Simple AI Image Generator Launcher"
echo "================================="

# Check if ComfyUI is already running
if lsof -i:8188 > /dev/null 2>&1; then
    echo "✓ ComfyUI is already running"
else
    echo "Starting ComfyUI server..."
    # Start ComfyUI in background
    cd ~/ComfyUI
    python main.py --auto-launch no > /tmp/comfyui.log 2>&1 &
    COMFYUI_PID=$!
    
    # Wait for server to start
    echo -n "Waiting for ComfyUI to start"
    for i in {1..30}; do
        if curl -s http://127.0.0.1:8188/system_stats > /dev/null 2>&1; then
            echo -e "\n✓ ComfyUI started successfully"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    if ! curl -s http://127.0.0.1:8188/system_stats > /dev/null 2>&1; then
        echo -e "\n✗ Failed to start ComfyUI"
        echo "Check /tmp/comfyui.log for errors"
        exit 1
    fi
fi

# Start the GUI
echo "Starting Image Generator GUI..."
cd "$(dirname "$0")"
python comfyui_simple_gui.py

# Optional: Kill ComfyUI when GUI closes (comment out if you want it to keep running)
# if [ ! -z "$COMFYUI_PID" ]; then
#     echo "Stopping ComfyUI..."
#     kill $COMFYUI_PID
# fi