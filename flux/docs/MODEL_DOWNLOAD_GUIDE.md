# Flux Model Download Guide

## Important Note

The Flux models from Black Forest Labs require authentication to download from Hugging Face. The CLIP encoders have been successfully downloaded, but the main Flux checkpoint and VAE require additional steps.

## Current Status

✅ **Downloaded:**
- CLIP-L encoder (235MB) - `/media/rese/AL/flux/clip/clip_l.safetensors`
- T5-XXL FP8 encoder (4.6GB) - `/media/rese/AL/flux/clip/t5xxl_fp8_e4m3fn.safetensors`

❌ **Pending (Requires Authentication):**
- Flux Schnell checkpoint (~6.5GB)
- VAE model (~335MB)

## Download Options

### Option 1: Hugging Face CLI (Recommended)

1. Install Hugging Face CLI:
```bash
pip install huggingface-hub
```

2. Login to Hugging Face:
```bash
huggingface-cli login
```

3. Download the models:
```bash
# Flux checkpoint
huggingface-cli download black-forest-labs/FLUX.1-schnell flux1-schnell.safetensors \
  --local-dir /media/rese/AL/flux/checkpoints/

# VAE
huggingface-cli download black-forest-labs/FLUX.1-schnell ae.safetensors \
  --local-dir /media/rese/AL/flux/vae/
```

### Option 2: Manual Download

1. Visit https://huggingface.co/black-forest-labs/FLUX.1-schnell
2. Sign in to your Hugging Face account
3. Accept the license agreement if required
4. Download:
   - `flux1-schnell.safetensors` → `/media/rese/AL/flux/checkpoints/`
   - `ae.safetensors` → `/media/rese/AL/flux/vae/`

### Option 3: Alternative Sources

Check these alternative sources for Flux models:
- CivitAI: https://civitai.com/models?query=flux
- Direct links from community (verify checksums)

## ComfyUI Configuration

Once downloaded, you may need to:

1. Create symbolic links to ComfyUI's model directories:
```bash
# Link to unet directory for Flux
ln -s /media/rese/AL/flux/checkpoints/flux1-schnell.safetensors \
      /media/rese/AL/models/unet/flux1-schnell.safetensors

# Link VAE
ln -s /media/rese/AL/flux/vae/ae.safetensors \
      /media/rese/AL/models/vae/ae.safetensors
```

2. Or update ComfyUI's extra model paths in `extra_model_paths.yaml`

## Verification

After downloading, verify the models:
```bash
npm run verify-models
```

Expected file sizes:
- Flux Schnell: ~6.5GB
- VAE: ~335MB

## Alternative: Use Existing Models

If you have other models available (like SDXL or Kandinsky), you can temporarily use those for testing the application while waiting for Flux models.

---

*Last updated: December 2024*