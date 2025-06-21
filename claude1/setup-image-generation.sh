#!/bin/bash

echo "=== Setting up Local AI Image Generation for AMD GPU ==="
echo

# Create directory for image generation
mkdir -p ~/ai-image-generation
cd ~/ai-image-generation

# Option 1: ComfyUI (Recommended for AMD)
echo "1. Setting up ComfyUI (recommended for AMD GPUs)..."
echo

read -p "Install ComfyUI? (y/n): " install_comfy
if [[ $install_comfy == "y" ]]; then
    # Clone ComfyUI
    git clone https://github.com/comfyanonymous/ComfyUI.git
    cd ComfyUI
    
    # Create Python environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Install PyTorch for ROCm
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm5.7
    
    # Install ComfyUI requirements
    pip install -r requirements.txt
    
    # Download a checkpoint model
    echo "Downloading Stable Diffusion model..."
    mkdir -p models/checkpoints
    cd models/checkpoints
    
    # Download SD 1.5 (smaller, faster for memes)
    wget -c https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors
    
    cd ../..
    
    # Create launch script
    cat > run_comfyui.sh << 'EOF'
#!/bin/bash
export HSA_OVERRIDE_GFX_VERSION=10.3.0
export ROCR_VISIBLE_DEVICES=0
source venv/bin/activate
python main.py --listen 0.0.0.0 --port 8188
EOF
    chmod +x run_comfyui.sh
    
    echo "ComfyUI installed! Run with: ./run_comfyui.sh"
    cd ..
fi

echo
echo "2. Alternative: Stable Diffusion WebUI with DirectML..."
read -p "Install SD WebUI for AMD? (y/n): " install_webui
if [[ $install_webui == "y" ]]; then
    git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
    cd stable-diffusion-webui
    
    # Create AMD-specific launch script
    cat > webui-user.sh << 'EOF'
#!/bin/bash
export COMMANDLINE_ARGS="--precision full --no-half --opt-sub-quad-attention --lowvram --disable-nan-check"
export PYTORCH_HIP_ALLOC_CONF=garbage_collection_threshold:0.6,max_split_size_mb:128
export HSA_OVERRIDE_GFX_VERSION=10.3.0
export ROCR_VISIBLE_DEVICES=0
EOF
    
    echo "WebUI configured for AMD. Run with: ./webui.sh"
    cd ..
fi

echo
echo "3. Creating simple API wrapper for image generation..."

# Create a simple API wrapper
cat > image_gen_api.py << 'EOF'
import requests
import json
import base64
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

# Configuration
COMFYUI_URL = "http://localhost:8188"
WEBUI_URL = "http://localhost:7860"

def generate_with_comfyui(prompt, style="meme"):
    """Generate image using ComfyUI API"""
    workflow = {
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": -1,
                "steps": 20,
                "cfg": 7,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            }
        },
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": "v1-5-pruned-emaonly.safetensors"
            }
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": 512,
                "height": 512,
                "batch_size": 1
            }
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": f"{prompt}, meme style, funny, viral, trending",
                "clip": ["4", 1]
            }
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": "blurry, bad quality, ugly",
                "clip": ["4", 1]
            }
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2]
            }
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {
                "images": ["8", 0],
                "filename_prefix": "meme"
            }
        }
    }
    
    # Queue the workflow
    response = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow})
    if response.status_code == 200:
        prompt_id = response.json()['prompt_id']
        # Wait for completion and get image
        # In production, implement proper polling
        return {"status": "queued", "prompt_id": prompt_id}
    return None

def generate_with_webui(prompt, style="meme"):
    """Generate image using Automatic1111 WebUI API"""
    payload = {
        "prompt": f"{prompt}, meme style, funny, viral, trending, high quality",
        "negative_prompt": "blurry, bad quality, ugly, distorted",
        "steps": 20,
        "width": 512,
        "height": 512,
        "cfg_scale": 7,
        "sampler_name": "Euler a"
    }
    
    response = requests.post(f"{WEBUI_URL}/sdapi/v1/txt2img", json=payload)
    if response.status_code == 200:
        images = response.json()['images']
        return {"image": images[0]} if images else None
    return None

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    prompt = data.get('prompt', '')
    style = data.get('style', 'meme')
    
    # Try ComfyUI first, then WebUI
    result = None
    try:
        result = generate_with_comfyui(prompt, style)
    except:
        try:
            result = generate_with_webui(prompt, style)
        except:
            pass
    
    if result:
        return jsonify(result)
    return jsonify({"error": "Failed to generate image"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5555)
EOF

echo
echo "=== Setup Complete ==="
echo
echo "To use AI image generation:"
echo "1. Start ComfyUI: cd ~/ai-image-generation/ComfyUI && ./run_comfyui.sh"
echo "2. Or start WebUI: cd ~/ai-image-generation/stable-diffusion-webui && ./webui.sh"
echo "3. Start the API wrapper: python3 ~/ai-image-generation/image_gen_api.py"
echo
echo "The API will be available at http://localhost:5555/generate"