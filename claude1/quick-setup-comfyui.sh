#!/bin/bash

echo "=== Quick ComfyUI Setup for AMD RX 6700 XT ==="
echo

# Check if ComfyUI directory exists
if [ -d "$HOME/ComfyUI" ]; then
    echo "ComfyUI directory already exists at ~/ComfyUI"
    read -p "Use existing installation? (y/n): " use_existing
    if [[ $use_existing == "y" ]]; then
        cd ~/ComfyUI
    else
        echo "Please remove or rename the existing directory first."
        exit 1
    fi
else
    # Clone ComfyUI
    echo "Cloning ComfyUI..."
    cd ~
    git clone https://github.com/comfyanonymous/ComfyUI.git
    cd ComfyUI
fi

# Install/Update Python dependencies
echo
echo "Setting up Python environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# Install PyTorch for ROCm (AMD GPU)
echo "Installing PyTorch for AMD GPU..."
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm5.7

# Install ComfyUI requirements
echo "Installing ComfyUI requirements..."
pip install -r requirements.txt
pip install xformers triton

# Create models directory
mkdir -p models/checkpoints

# Download SD 1.5 if not present
if [ ! -f "models/checkpoints/v1-5-pruned-emaonly.safetensors" ]; then
    echo
    echo "Downloading Stable Diffusion 1.5 model (good for memes)..."
    cd models/checkpoints
    wget -c --show-progress https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors
    cd ../..
fi

# Create AMD-optimized launch script
cat > run_amd.sh << 'EOF'
#!/bin/bash
# AMD GPU environment variables
export HSA_OVERRIDE_GFX_VERSION=10.3.0
export ROCR_VISIBLE_DEVICES=0
export HIP_VISIBLE_DEVICES=0
export PYTORCH_HIP_ALLOC_CONF=garbage_collection_threshold:0.6,max_split_size_mb:128

# Activate virtual environment
source venv/bin/activate

# Launch ComfyUI with API enabled
echo "Starting ComfyUI on http://localhost:8188"
python main.py --listen 0.0.0.0 --port 8188
EOF

chmod +x run_amd.sh

# Create meme-specific workflow
echo
echo "Creating meme generation workflow..."
mkdir -p custom_nodes
cat > workflows/meme_generator.json << 'EOF'
{
  "last_node_id": 10,
  "last_link_id": 10,
  "nodes": [
    {
      "id": 4,
      "type": "CheckpointLoaderSimple",
      "pos": [50, 200],
      "size": {"0": 315, "1": 98},
      "outputs": [
        {"name": "MODEL", "type": "MODEL", "links": [1]},
        {"name": "CLIP", "type": "CLIP", "links": [3, 5]},
        {"name": "VAE", "type": "VAE", "links": [8]}
      ],
      "properties": {},
      "widgets_values": ["v1-5-pruned-emaonly.safetensors"]
    },
    {
      "id": 6,
      "type": "CLIPTextEncode",
      "pos": [400, 200],
      "size": {"0": 400, "1": 200},
      "inputs": [
        {"name": "clip", "type": "CLIP", "link": 3}
      ],
      "outputs": [
        {"name": "CONDITIONING", "type": "CONDITIONING", "links": [4]}
      ],
      "properties": {},
      "widgets_values": ["funny meme about programming, viral, trending, high quality"]
    },
    {
      "id": 3,
      "type": "KSampler",
      "pos": [850, 200],
      "size": {"0": 315, "1": 262},
      "inputs": [
        {"name": "model", "type": "MODEL", "link": 1},
        {"name": "positive", "type": "CONDITIONING", "link": 4},
        {"name": "negative", "type": "CONDITIONING", "link": 6},
        {"name": "latent_image", "type": "LATENT", "link": 2}
      ],
      "outputs": [
        {"name": "LATENT", "type": "LATENT", "links": [7]}
      ],
      "properties": {},
      "widgets_values": [-1, "fixed", 20, 7, "euler", "normal", 1]
    }
  ]
}
EOF

echo
echo "=== Setup Complete! ==="
echo
echo "To start ComfyUI with AMD GPU support:"
echo "cd ~/ComfyUI && ./run_amd.sh"
echo
echo "Then update your app's .env to include:"
echo "COMFYUI_URL=http://localhost:8188"
echo
echo "ComfyUI will be available at: http://localhost:8188"
echo "API endpoint: http://localhost:8188/prompt"