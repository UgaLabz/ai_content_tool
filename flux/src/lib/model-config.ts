export const MODEL_CONFIG = {
  basePath: process.env.MODEL_PATH || '/media/rese/AL/models',
  
  models: {
    flux_schnell: {
      name: 'Flux Schnell',
      type: 'unet',
      path: 'unet/flux1-schnell.safetensors',
      description: 'Fast 4-step generation model',
      requirements: {
        vram: 16, // GB
        steps: 4,
        guidance: 0.0,
      },
    },
  },
  
  textEncoders: {
    clip_l: {
      name: 'CLIP-L',
      path: 'clip/clip_l.safetensors',
      type: 'clip',
    },
    t5xxl: {
      name: 'T5-XXL FP8',
      path: 'clip/t5xxl_fp8_e4m3fn.safetensors',
      type: 't5',
    },
  },
  
  vae: {
    flux_vae: {
      name: 'Flux VAE',
      path: 'vae/ae.safetensors',
      type: 'vae',
    },
  },
  
  // ComfyUI workflow configuration
  workflow: {
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 4,
    defaultGuidance: 0.0,
    defaultSampler: 'euler',
    defaultScheduler: 'simple',
  },
} as const

export type ModelConfig = typeof MODEL_CONFIG