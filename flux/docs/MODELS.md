# Flux Models Documentation

This document describes the AI models used in the Flux Browser application and their specifications.

## Model Overview

The Flux Browser app uses the Flux Schnell model for local image generation. Flux Schnell is optimized for fast inference, capable of generating high-quality images in just 4 steps.

## Required Models

### 1. Flux Schnell Checkpoint
- **File**: `flux1-schnell.safetensors`
- **Size**: ~6.5 GB
- **Location**: `/media/rese/AL/flux/checkpoints/`
- **Purpose**: Main image generation model
- **License**: Apache 2.0 (commercial use allowed)

### 2. Text Encoders

#### CLIP-L
- **File**: `clip_l.safetensors`
- **Size**: ~246 MB
- **Location**: `/media/rese/AL/flux/clip/`
- **Purpose**: Text encoding for prompt understanding

#### T5-XXL (FP8)
- **File**: `t5xxl_fp8_e4m3fn.safetensors`
- **Size**: ~4.9 GB
- **Location**: `/media/rese/AL/flux/clip/`
- **Purpose**: Advanced text encoding for complex prompts
- **Note**: FP8 quantized version for reduced memory usage

### 3. VAE (Variational Autoencoder)
- **File**: `ae.safetensors`
- **Size**: ~335 MB
- **Location**: `/media/rese/AL/flux/vae/`
- **Purpose**: Image encoding/decoding

## Model Specifications

### Flux Schnell
- **Architecture**: 12B parameter rectified flow transformer
- **Training**: Distilled from Flux Pro using latent adversarial diffusion
- **Inference Steps**: 1-4 (optimized for 4)
- **Guidance Scale**: 0.0 (guidance-free)
- **Resolution**: Supports up to 2048x2048
- **VRAM Requirements**: 16GB+ (FP8), 24GB+ (FP16)

## Download Instructions

### Automatic Download

Run the provided download script:

```bash
cd flux
./scripts/download_models.sh
```

This will download all required models to `/media/rese/AL/flux/`.

### Manual Download

If you prefer to download manually:

1. **Flux Schnell**: [Hugging Face](https://huggingface.co/black-forest-labs/FLUX.1-schnell)
2. **Text Encoders**: [ComfyAnonymous Collection](https://huggingface.co/comfyanonymous/flux_text_encoders)
3. **VAE**: Included with Flux Schnell

### Alternative Sources

- **CivitAI**: Community-hosted versions
- **Direct URLs**: Available in `scripts/download_models.sh`

## Model Verification

After downloading, verify models are correctly installed:

```bash
npm run verify-models
```

This checks:
- All model files exist
- File sizes are correct
- Paths are properly configured

## Performance Optimization

### Memory Usage

- **FP16 (Full Precision)**: ~24GB VRAM required
- **FP8 (Recommended)**: ~16GB VRAM required
- **CPU Offloading**: Possible but very slow

### Generation Speed

Typical generation times on various GPUs:
- **RTX 4090**: ~2-3 seconds
- **RTX 4080**: ~3-4 seconds
- **RTX 4070**: ~4-5 seconds
- **RTX 3090**: ~4-6 seconds

### Optimization Tips

1. Use FP8 models for lower VRAM usage
2. Keep models on fast SSD storage
3. Preload models on application start
4. Use appropriate resolution for your GPU

## Model Configuration

The model paths are configured in `src/lib/model-config.ts`:

```typescript
export const MODEL_CONFIG = {
  basePath: '/media/rese/AL/flux',
  models: {
    flux_schnell: {
      path: 'checkpoints/flux1-schnell.safetensors',
      // ... configuration
    }
  }
  // ... other models
}
```

## Troubleshooting

### Out of Memory Errors
- Use FP8 models instead of FP16
- Reduce generation resolution
- Enable CPU offloading (slower)

### Model Not Found
- Check file paths in model config
- Verify symbolic links are working
- Ensure proper file permissions

### Slow Generation
- Ensure models are on SSD, not HDD
- Check GPU utilization
- Verify CUDA is properly installed

## Future Models (Phase 2)

When implementing cloud support, these models will be available:
- **Flux Pro**: Higher quality, more steps
- **Flux Ultra**: Best quality, commercial use
- **Flux Kontext**: Image editing capabilities

---

*Last updated: December 2024*