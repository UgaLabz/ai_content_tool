# Model Configuration System

## Overview

The Simple AI Image Generator uses a comprehensive JSON-based configuration system to manage multiple diffusion models. This system provides flexibility, extensibility, and easy maintenance of model configurations.

## Configuration Structure

### Main Configuration File

The system uses `model_configs.json` as the central configuration file with the following structure:

```json
{
  "models": { ... },
  "workflow_templates": { ... },
  "model_paths": { ... },
  "download_sources": { ... }
}
```

### Model Configuration Schema

Each model configuration contains:

```json
{
  "display_name": "Human-readable name",
  "type": "Model type (sd15, sd21, sdxl, etc.)",
  "checkpoint_files": ["List of possible checkpoint filenames"],
  "vae_files": ["Optional VAE files"],
  "vram_requirements": {
    "minimum": 4,
    "recommended": 6,
    "optimal": 8
  },
  "resolutions": {
    "square": ["512x512", "768x768"],
    "landscape": ["768x512", "896x512"],
    "portrait": ["512x768", "512x896"],
    "default": "512x512"
  },
  "optimal_settings": {
    "steps": 20,
    "cfg_scale": 7.5,
    "sampler": "euler_a",
    "scheduler": "normal"
  },
  "capabilities": {
    "supports_inpainting": true,
    "supports_img2img": true,
    "supports_controlnet": true,
    "supports_lora": true
  }
}
```

## Supported Models

### Stable Diffusion 1.5
- **Type**: `sd15`
- **VRAM**: 4-6 GB
- **Native Resolution**: 512x512
- **Best For**: General purpose, fast generation

### Stable Diffusion 2.1
- **Type**: `sd21`
- **VRAM**: 6-8 GB
- **Native Resolution**: 768x768
- **Best For**: Higher quality, larger images

### SDXL Base
- **Type**: `sdxl`
- **VRAM**: 8-10 GB
- **Native Resolution**: 1024x1024
- **Best For**: High quality, detailed images
- **Special**: Supports refiner model

### OpenJourney
- **Type**: `sd15`
- **VRAM**: 4-6 GB
- **Native Resolution**: 512x512
- **Best For**: Artistic, Midjourney-style images

### DreamShaper
- **Type**: `sd15`
- **VRAM**: 4-6 GB
- **Native Resolution**: 512x512
- **Best For**: Photorealistic images

### Kandinsky 2.2
- **Type**: `kandinsky`
- **VRAM**: 8-10 GB
- **Native Resolution**: 768x768
- **Best For**: Multilingual prompts, artistic style

### DeepFloyd IF
- **Type**: `deepfloyd`
- **VRAM**: 16-24 GB
- **Native Resolution**: 1024x1024 (multi-stage)
- **Best For**: Text rendering, high detail

## Model Configuration Manager

The `ModelConfigManager` class provides programmatic access to configurations:

### Key Methods

```python
# Initialize manager
manager = ModelConfigManager()

# Get all available models
models = manager.get_available_models()

# Get specific model config
config = manager.get_model_config('stable-diffusion-15')

# Find checkpoint file
checkpoint = manager.get_checkpoint_path('sdxl')

# Validate model installation
validation = manager.validate_model_installation('openjourney')

# Check VRAM compatibility
compatibility = manager.check_vram_compatibility('sdxl', available_vram=8)

# Get optimal resolution
resolution = manager.get_optimal_resolution('stable-diffusion-15', 'landscape')
```

## Workflow Templates

Each model type has a corresponding workflow template in the `workflows/` directory:

- `sd15_template.json` - Standard SD 1.5 workflow
- `sd21_template.json` - SD 2.1 workflow with 768x768 support
- `sdxl_template.json` - SDXL workflow with refiner support

### Template Variables

Workflow templates use placeholder variables:
- `{checkpoint}` - Model checkpoint filename
- `{width}`, `{height}` - Image dimensions
- `{steps}` - Sampling steps
- `{cfg_scale}` - Guidance scale
- `{positive_prompt}`, `{negative_prompt}` - Text prompts

## File Organization

```
simple_image_gen/
├── model_configs.json          # Main configuration file
├── model_config_manager.py     # Configuration manager
└── workflows/                  # Workflow templates
    ├── sd15_template.json
    ├── sd21_template.json
    └── sdxl_template.json
```

## Adding New Models

To add a new model:

1. Add model entry to `model_configs.json`:
```json
"new-model": {
  "display_name": "New Model",
  "type": "sd15",
  "checkpoint_files": ["new-model.safetensors"],
  ...
}
```

2. Create workflow template if needed
3. Add download source information
4. Test with configuration manager

## Model Installation

Models should be placed in the ComfyUI model directories:

- **Checkpoints**: `~/ComfyUI/models/checkpoints/`
- **VAE**: `~/ComfyUI/models/vae/`
- **LoRA**: `~/ComfyUI/models/loras/`
- **ControlNet**: `~/ComfyUI/models/controlnet/`

## Download Sources

The configuration includes download information:

### HuggingFace Models
- Direct download from HuggingFace Hub
- Requires `huggingface-cli` for some models

### CivitAI Models
- Community models like OpenJourney, DreamShaper
- Manual download required

## VRAM Management

The system provides three VRAM levels:
- **Minimum**: Basic functionality, may be slow
- **Recommended**: Good performance
- **Optimal**: Best performance, all features enabled

## Best Practices

1. **Model Selection**: Choose models based on available VRAM
2. **Resolution**: Use native resolutions for best quality
3. **Settings**: Start with optimal settings, then adjust
4. **Validation**: Always validate model installation before use

## Troubleshooting

### Model Not Found
- Check filename matches exactly
- Verify model is in correct directory
- Run validation check

### VRAM Issues
- Use lower resolution
- Reduce batch size
- Choose lighter model

### Workflow Errors
- Verify all node connections
- Check template variables
- Ensure model supports features