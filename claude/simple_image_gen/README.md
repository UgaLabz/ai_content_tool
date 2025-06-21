# Simple AI Image Generator

A lightweight GUI for generating images using ComfyUI with support for multiple Stable Diffusion models.

## Features
- Simple, clean interface
- **Multi-model support**: SD 1.5, SDXL, OpenJourney, DreamShaper, SD 2.1
- **Dynamic resolution selection** based on model capabilities
- **VRAM usage display** for each model
- Works with your existing ComfyUI installation
- AMD GPU compatible
- Automatic image saving
- Minimal dependencies

## Prerequisites
- Python 3.8+
- ComfyUI installed (found at ~/ComfyUI)
- Stable Diffusion model in ComfyUI

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Option 1: Use the startup script (Recommended)
```bash
./start_image_generator.sh
```
This will automatically start ComfyUI if needed and launch the GUI.

### Option 2: Manual start
1. Start ComfyUI in one terminal:
```bash
cd ~/ComfyUI
python main.py
```

2. In another terminal, run the GUI:
```bash
python comfyui_simple_gui.py
```

## How it works
1. Select your preferred model from the dropdown
2. Choose a resolution (automatically filtered for the selected model)
3. Enter your prompt in the text box
4. Click "Generate Image"
5. Wait for generation (typically 10-30 seconds)
6. Image appears in the GUI and is saved to `generated_images/`

## Supported Models

| Model | VRAM Required | Resolutions | Best For |
|-------|--------------|-------------|----------|
| Stable Diffusion 1.5 | 4-6 GB | 512x512, 768x512 | General purpose, fast |
| SDXL Base | 8-10 GB | 1024x1024, 1152x896 | High quality, detailed |
| OpenJourney | 4-6 GB | 512x512, 768x512 | Artistic, Midjourney-style |
| DreamShaper | 4-6 GB | 512x512, 768x512 | Photorealistic |
| SD 2.1 | 6-8 GB | 768x768, 1024x768 | Higher resolution |

## Troubleshooting

### ComfyUI not running
- The GUI will show "ComfyUI not running" if the server isn't accessible
- Make sure ComfyUI is running on port 8188

### AMD GPU
- ComfyUI should automatically detect and use your AMD GPU with ROCm
- Check ComfyUI console output to confirm GPU usage

### Model not found
- Make sure you have the selected model in `~/ComfyUI/models/checkpoints/`
- Model filenames must match exactly:
  - SD 1.5: `v1-5-pruned-emaonly.ckpt`
  - SDXL: `sd_xl_base_1.0.safetensors`
  - OpenJourney: `openjourney-v4.ckpt`
  - DreamShaper: `dreamshaper_8.safetensors`
  - SD 2.1: `v2-1_768-ema-pruned.ckpt`
- You can modify model filenames in the `models` dictionary in `comfyui_simple_gui.py`

## Customization
- Edit the workflow in `comfyui_simple_gui.py` to change:
  - Image size (default 512x512)
  - Sampling steps (default 20)
  - CFG scale (default 8)
  - Negative prompts