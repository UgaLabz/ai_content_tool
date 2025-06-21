import axios from 'axios';
import { logger } from '../../utils/logger';
import path from 'path';
import fs from 'fs/promises';

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  style?: 'meme' | 'cartoon' | 'realistic' | 'artistic';
  negativePrompt?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  imagePath: string;
  prompt: string;
  metadata: {
    width: number;
    height: number;
    steps: number;
    seed: number;
    model: string;
  };
}

export class ImageGenerationService {
  private comfyUIUrl = process.env.COMFYUI_URL || 'http://localhost:8188';
  private webuiUrl = process.env.WEBUI_URL || 'http://localhost:7860';
  private outputDir: string;

  constructor(outputDir: string = './generated-images') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  private async ensureOutputDir() {
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async generateMemeImage(
    prompt: string,
    characterStyle?: string,
    options: ImageGenerationOptions = {}
  ): Promise<ImageGenerationResult> {
    // Enhance prompt for meme generation
    const memePrompt = this.buildMemePrompt(prompt, characterStyle);
    
    // Try different backends
    let result = null;
    
    // Try ComfyUI first (better for AMD GPUs)
    try {
      result = await this.generateWithComfyUI(memePrompt, options);
    } catch (error) {
      logger.warn('ComfyUI generation failed, trying WebUI', error);
      
      // Fallback to Automatic1111 WebUI
      try {
        result = await this.generateWithWebUI(memePrompt, options);
      } catch (webuiError) {
        logger.warn('WebUI generation failed, using fallback', webuiError);
        
        // Final fallback - generate placeholder
        result = await this.generatePlaceholder(memePrompt, options);
      }
    }

    return result;
  }

  private buildMemePrompt(basePrompt: string, characterStyle?: string): string {
    const styleModifiers = {
      meme: 'internet meme style, funny, viral, trending, bold text, impact font',
      cartoon: 'cartoon style, colorful, exaggerated, comic',
      realistic: 'photorealistic, detailed, high quality',
      artistic: 'artistic, creative, unique style'
    };

    let enhancedPrompt = basePrompt;
    
    // Add character-specific style if provided
    if (characterStyle) {
      enhancedPrompt += `, ${characterStyle}`;
    }
    
    // Add meme-specific modifiers
    enhancedPrompt += `, ${styleModifiers.meme}`;
    
    // Add quality modifiers
    enhancedPrompt += ', high quality, sharp, clear, professional';
    
    return enhancedPrompt;
  }

  private async generateWithComfyUI(
    prompt: string,
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    const workflow = this.buildComfyUIWorkflow(prompt, options);
    
    // Queue the prompt
    const response = await axios.post(`${this.comfyUIUrl}/prompt`, {
      prompt: workflow
    });
    
    const promptId = response.data.prompt_id;
    
    // Poll for completion
    const imageData = await this.pollComfyUIResult(promptId);
    
    // Save the image
    const imagePath = await this.saveImage(imageData, 'comfyui');
    
    return {
      imageUrl: `/api/images/${path.basename(imagePath)}`,
      imagePath,
      prompt,
      metadata: {
        width: options.width || 512,
        height: options.height || 512,
        steps: options.steps || 20,
        seed: options.seed || -1,
        model: 'stable-diffusion-v1-5'
      }
    };
  }

  private buildComfyUIWorkflow(prompt: string, options: ImageGenerationOptions): any {
    return {
      "3": {
        "class_type": "KSampler",
        "inputs": {
          "seed": options.seed || -1,
          "steps": options.steps || 20,
          "cfg": options.cfgScale || 7,
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
          "width": options.width || 512,
          "height": options.height || 512,
          "batch_size": 1
        }
      },
      "6": {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "text": prompt,
          "clip": ["4", 1]
        }
      },
      "7": {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "text": options.negativePrompt || "blurry, bad quality, ugly, distorted, low quality",
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
    };
  }

  private async pollComfyUIResult(promptId: string, maxAttempts = 60): Promise<Buffer> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const historyResponse = await axios.get(`${this.comfyUIUrl}/history/${promptId}`);
        const history = historyResponse.data[promptId];
        
        if (history && history.outputs) {
          // Find the output image
          for (const [nodeId, output] of Object.entries(history.outputs)) {
            if (output.images && output.images.length > 0) {
              const imageInfo = output.images[0];
              const imageResponse = await axios.get(
                `${this.comfyUIUrl}/view?filename=${imageInfo.filename}&subfolder=${imageInfo.subfolder || ''}`,
                { responseType: 'arraybuffer' }
              );
              return Buffer.from(imageResponse.data);
            }
          }
        }
      } catch (error) {
        // Continue polling
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Timeout waiting for image generation');
  }

  private async generateWithWebUI(
    prompt: string,
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    const payload = {
      prompt,
      negative_prompt: options.negativePrompt || "blurry, bad quality, ugly, distorted",
      steps: options.steps || 20,
      width: options.width || 512,
      height: options.height || 512,
      cfg_scale: options.cfgScale || 7,
      sampler_name: "Euler a",
      seed: options.seed || -1
    };
    
    const response = await axios.post(`${this.webuiUrl}/sdapi/v1/txt2img`, payload);
    
    if (response.data.images && response.data.images.length > 0) {
      const imageData = Buffer.from(response.data.images[0], 'base64');
      const imagePath = await this.saveImage(imageData, 'webui');
      
      return {
        imageUrl: `/api/images/${path.basename(imagePath)}`,
        imagePath,
        prompt,
        metadata: {
          width: options.width || 512,
          height: options.height || 512,
          steps: options.steps || 20,
          seed: response.data.info?.seed || -1,
          model: 'stable-diffusion-v1-5'
        }
      };
    }
    
    throw new Error('No image generated');
  }

  private async generatePlaceholder(
    prompt: string,
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    // Create a placeholder image with canvas
    const { createCanvas } = await import('canvas');
    const canvas = createCanvas(options.width || 512, options.height || 512);
    const ctx = canvas.getContext('2d');
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AI Image Generation', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '16px Arial';
    ctx.fillText('(Service not available)', canvas.width / 2, canvas.height / 2 + 10);
    ctx.font = '12px Arial';
    ctx.fillText(prompt.substring(0, 50) + '...', canvas.width / 2, canvas.height / 2 + 40);
    
    const imageData = canvas.toBuffer('image/png');
    const imagePath = await this.saveImage(imageData, 'placeholder');
    
    return {
      imageUrl: `/api/images/${path.basename(imagePath)}`,
      imagePath,
      prompt,
      metadata: {
        width: options.width || 512,
        height: options.height || 512,
        steps: 0,
        seed: -1,
        model: 'placeholder'
      }
    };
  }

  private async saveImage(imageData: Buffer, prefix: string): Promise<string> {
    const filename = `${prefix}-${Date.now()}.png`;
    const filepath = path.join(this.outputDir, filename);
    await fs.writeFile(filepath, imageData);
    return filepath;
  }

  async checkAvailability(): Promise<{
    comfyui: boolean;
    webui: boolean;
  }> {
    let comfyui = false;
    let webui = false;
    
    try {
      await axios.get(`${this.comfyUIUrl}/system_stats`);
      comfyui = true;
    } catch {}
    
    try {
      await axios.get(`${this.webuiUrl}/sdapi/v1/options`);
      webui = true;
    } catch {}
    
    return { comfyui, webui };
  }
}