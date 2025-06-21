#!/bin/bash

# Kill existing Ollama processes
echo "Stopping existing Ollama processes..."
sudo pkill ollama 2>/dev/null
sleep 2

# Set AMD GPU environment variables
export HSA_OVERRIDE_GFX_VERSION=10.3.0
export ROCR_VISIBLE_DEVICES=0
export GPU_DEVICE_ORDINAL=0
export HIP_VISIBLE_DEVICES=0

echo "Starting Ollama with AMD GPU support..."
echo "Environment:"
echo "  HSA_OVERRIDE_GFX_VERSION=$HSA_OVERRIDE_GFX_VERSION"
echo "  ROCR_VISIBLE_DEVICES=$ROCR_VISIBLE_DEVICES"

# Start Ollama with environment variables
sudo -E /usr/local/bin/ollama serve &

echo "Waiting for Ollama to start..."
sleep 5

# Test GPU detection
echo "Testing GPU support..."
ollama list

echo
echo "To monitor GPU usage during generation:"
echo "  watch -n 1 rocm-smi"