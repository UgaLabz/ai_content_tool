#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import { MODEL_CONFIG } from '../src/lib/model-config'

const REQUIRED_MODELS = [
  { name: 'Flux Schnell', path: MODEL_CONFIG.models.flux_schnell.path },
  { name: 'CLIP-L', path: MODEL_CONFIG.textEncoders.clip_l.path },
  { name: 'T5-XXL', path: MODEL_CONFIG.textEncoders.t5xxl.path },
  { name: 'VAE', path: MODEL_CONFIG.vae.flux_vae.path },
]

console.log('🔍 Verifying Flux models...')
console.log(`Base path: ${MODEL_CONFIG.basePath}`)
console.log('')

let allModelsFound = true

for (const model of REQUIRED_MODELS) {
  const fullPath = path.join(MODEL_CONFIG.basePath, model.path)
  
  try {
    const stats = fs.statSync(fullPath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`✅ ${model.name}: Found (${sizeMB} MB)`)
  } catch (error) {
    console.log(`❌ ${model.name}: Not found at ${fullPath}`)
    allModelsFound = false
  }
}

console.log('')

if (allModelsFound) {
  console.log('✨ All models verified successfully!')
} else {
  console.log('⚠️  Some models are missing.')
  console.log('Run ./scripts/download_models.sh to download them.')
  process.exit(1)
}

// Check ComfyUI connection
console.log('')
console.log('🔌 Checking ComfyUI connection...')
const comfyuiUrl = process.env.COMFYUI_URL || 'http://localhost:8188'

fetch(`${comfyuiUrl}/system_stats`)
  .then(response => {
    if (response.ok) {
      console.log(`✅ ComfyUI is running at ${comfyuiUrl}`)
    } else {
      console.log(`⚠️  ComfyUI returned status ${response.status}`)
    }
  })
  .catch(error => {
    console.log(`❌ Cannot connect to ComfyUI at ${comfyuiUrl}`)
    console.log('Make sure ComfyUI is running.')
  })