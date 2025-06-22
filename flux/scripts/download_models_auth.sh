#!/bin/bash

# Flux Model Download Script with HF Authentication
# Downloads required models for Flux Schnell
HF_TOKEN="${HUGGING_FACE_TOKEN:-}"
MODEL_DIR="/media/rese/AL/flux"
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if token is provided
if [ -z "$HF_TOKEN" ]; then
    echo -e "${RED}Error: HUGGING_FACE_TOKEN environment variable is not set${NC}"
    echo "Please set it by running: export HUGGING_FACE_TOKEN='your_token_here'"
    exit 1
fi

echo -e "${YELLOW}Flux Model Download Script (with Authentication)${NC}"
echo "======================================"
echo "This script will download the required models for Flux Schnell"
echo "Target directory: $MODEL_DIR"
echo ""

# Check if HF_TOKEN is set
if [ -z "$HF_TOKEN" ]; then
    echo -e "${YELLOW}Hugging Face token not found in environment.${NC}"
    echo "Please enter your Hugging Face token (starts with hf_...):"
    echo "Get one at: https://huggingface.co/settings/tokens"
    read -s HF_TOKEN
    echo ""
fi

# Check if directory exists
if [ ! -d "$MODEL_DIR" ]; then
    echo -e "${RED}Error: Model directory does not exist at $MODEL_DIR${NC}"
    echo "Please create it first with: mkdir -p $MODEL_DIR/{checkpoints,clip,vae}"
    exit 1
fi

# Function to download with progress and authentication
download_file_auth() {
    local url=$1
    local output=$2
    local name=$3
    
    echo -e "${YELLOW}Downloading $name...${NC}"
    if wget --header="Authorization: Bearer $HF_TOKEN" -c "$url" -O "$output" --show-progress; then
        echo -e "${GREEN}✓ Successfully downloaded $name${NC}"
    else
        echo -e "${RED}✗ Failed to download $name${NC}"
        echo "Make sure you have accepted the model license at:"
        echo "https://huggingface.co/black-forest-labs/FLUX.1-schnell"
        return 1
    fi
}

# Function to download without auth (for public models)
download_file() {
    local url=$1
    local output=$2
    local name=$3
    
    echo -e "${YELLOW}Downloading $name...${NC}"
    if wget -c "$url" -O "$output" --show-progress; then
        echo -e "${GREEN}✓ Successfully downloaded $name${NC}"
    else
        echo -e "${RED}✗ Failed to download $name${NC}"
        return 1
    fi
}

# Model URLs
FLUX_SCHNELL_URL="https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/flux1-schnell.safetensors"
CLIP_L_URL="https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors"
T5_XXL_URL="https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn.safetensors"
VAE_URL="https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/ae.safetensors"

echo "Models to download:"
echo "1. Flux Schnell checkpoint (~6.5GB) - Requires authentication"
echo "2. CLIP-L text encoder (~246MB)"
echo "3. T5-XXL text encoder (FP8) (~4.9GB)"
echo "4. VAE model (~335MB) - Requires authentication"
echo ""
echo -e "${YELLOW}Total download size: ~12GB${NC}"
echo ""

read -p "Continue with download? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Download cancelled."
    exit 0
fi

echo ""
echo "Starting downloads..."
echo ""

# Download models
download_file_auth "$FLUX_SCHNELL_URL" "$MODEL_DIR/checkpoints/flux1-schnell.safetensors" "Flux Schnell checkpoint"
download_file "$CLIP_L_URL" "$MODEL_DIR/clip/clip_l.safetensors" "CLIP-L encoder"
download_file "$T5_XXL_URL" "$MODEL_DIR/clip/t5xxl_fp8_e4m3fn.safetensors" "T5-XXL encoder"
download_file_auth "$VAE_URL" "$MODEL_DIR/vae/ae.safetensors" "VAE model"

echo ""
echo -e "${GREEN}Download complete!${NC}"
echo ""
echo "Model files are located at:"
echo "- Checkpoint: $MODEL_DIR/checkpoints/flux1-schnell.safetensors"
echo "- CLIP-L: $MODEL_DIR/clip/clip_l.safetensors"
echo "- T5-XXL: $MODEL_DIR/clip/t5xxl_fp8_e4m3fn.safetensors"
echo "- VAE: $MODEL_DIR/vae/ae.safetensors"
echo ""

# Create symbolic links for ComfyUI
echo "Creating symbolic links for ComfyUI..."
mkdir -p /media/rese/AL/models/unet
ln -sf "$MODEL_DIR/checkpoints/flux1-schnell.safetensors" "/media/rese/AL/models/unet/flux1-schnell.safetensors" 2>/dev/null
ln -sf "$MODEL_DIR/vae/ae.safetensors" "/media/rese/AL/models/vae/ae.safetensors" 2>/dev/null

echo -e "${GREEN}Setup complete! You can now use Flux models with ComfyUI.${NC}"