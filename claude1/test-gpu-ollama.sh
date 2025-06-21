#!/bin/bash

echo "=== Ollama AMD GPU Configuration Test ==="
echo

# Check current GPU environment
echo "1. Checking AMD GPU environment variables..."
echo "HSA_OVERRIDE_GFX_VERSION: ${HSA_OVERRIDE_GFX_VERSION:-not set}"
echo "ROCR_VISIBLE_DEVICES: ${ROCR_VISIBLE_DEVICES:-not set}"
echo

# Check ROCm installation
echo "2. ROCm Status:"
rocm-smi --showid --showtemp --showpower

echo
echo "3. Testing Ollama with GPU..."

# First, stop existing Ollama service
echo "Stopping existing Ollama service..."
sudo systemctl stop ollama 2>/dev/null || pkill ollama

# Wait for it to stop
sleep 2

# Set environment variables for AMD GPU
export HSA_OVERRIDE_GFX_VERSION=10.3.0  # For RDNA2 (RX 6700 XT)
export ROCR_VISIBLE_DEVICES=0
export GPU_DEVICE_ORDINAL=0
export HIP_VISIBLE_DEVICES=0

echo "Environment variables set:"
echo "HSA_OVERRIDE_GFX_VERSION=$HSA_OVERRIDE_GFX_VERSION"
echo "ROCR_VISIBLE_DEVICES=$ROCR_VISIBLE_DEVICES"

# Start Ollama with GPU support
echo
echo "4. Starting Ollama with AMD GPU support..."
nohup ollama serve > ollama-gpu.log 2>&1 &
OLLAMA_PID=$!
echo "Ollama PID: $OLLAMA_PID"

# Wait for Ollama to start
sleep 5

# Test GPU inference
echo
echo "5. Testing GPU inference with a small model..."
echo "Running: ollama run mistral:7b 'Say hello in 5 words'"

# Monitor GPU usage during inference
rocm-smi --showmemuse --showuse > gpu-before.txt

# Run inference
time ollama run mistral:7b "Say hello in 5 words" --verbose

# Check GPU usage after
rocm-smi --showmemuse --showuse > gpu-after.txt

echo
echo "6. GPU Usage Comparison:"
echo "Before inference:"
cat gpu-before.txt | grep -E "GPU|VRAM"
echo
echo "After inference:"
cat gpu-after.txt | grep -E "GPU|VRAM"

# Cleanup
rm gpu-before.txt gpu-after.txt

echo
echo "Test complete! Check ollama-gpu.log for detailed logs."
echo
echo "To make GPU support permanent, add these to your ~/.bashrc:"
echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0"
echo "export ROCR_VISIBLE_DEVICES=0"