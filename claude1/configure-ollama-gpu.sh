#!/bin/bash

echo "=== Configuring Ollama for AMD GPU (RX 6700 XT) ==="
echo

# Add environment variables to user's bashrc
echo "1. Adding GPU environment variables to ~/.bashrc..."
cat >> ~/.bashrc << 'EOF'

# Ollama AMD GPU Support (RX 6700 XT - RDNA2)
export HSA_OVERRIDE_GFX_VERSION=10.3.0
export ROCR_VISIBLE_DEVICES=0
export GPU_DEVICE_ORDINAL=0
export HIP_VISIBLE_DEVICES=0
EOF

echo "✓ Environment variables added to ~/.bashrc"

# Create Ollama directory if it doesn't exist
mkdir -p ~/.ollama

# Create Ollama environment file
echo "2. Creating Ollama environment configuration..."
cat > ~/.ollama/env << EOF
# AMD GPU Configuration for RX 6700 XT
HSA_OVERRIDE_GFX_VERSION=10.3.0
ROCR_VISIBLE_DEVICES=0
GPU_DEVICE_ORDINAL=0
HIP_VISIBLE_DEVICES=0

# Performance settings
OLLAMA_NUM_GPU=1
OLLAMA_GPU_MEMORY_FRACTION=0.8
OLLAMA_MAX_LOADED_MODELS=1
OLLAMA_NUM_PARALLEL=2
EOF

echo "✓ Ollama environment file created"

# Restart Ollama with new settings
echo
echo "3. Restarting Ollama with GPU support..."
pkill ollama 2>/dev/null
sleep 2

# Source the new environment
source ~/.bashrc

# Start Ollama
nohup ollama serve > ~/.ollama/gpu-startup.log 2>&1 &

echo "✓ Ollama restarted with GPU support"

# Wait for startup
sleep 5

# Verify GPU is being used
echo
echo "4. Verifying GPU configuration..."
echo "Checking Ollama logs for GPU detection..."
tail -20 ~/.ollama/gpu-startup.log | grep -i "gpu\|rocm\|amd" || echo "No GPU messages found yet"

echo
echo "5. Testing GPU acceleration..."
echo "Running a quick test..."
time ollama run mistral:7b "Hello" --verbose

echo
echo "=== Configuration Complete ==="
echo
echo "To verify GPU usage during generation:"
echo "1. In one terminal: watch -n 1 rocm-smi"
echo "2. In another terminal: run your meme generator"
echo
echo "The GPU should show increased usage during generation."