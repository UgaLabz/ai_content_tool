#!/usr/bin/env node

import axios from 'axios'
import { ComfyUIClient } from '../src/server/services/comfyui-client'

async function testComfyUI() {
  const comfyUrl = process.env.COMFYUI_URL || 'http://localhost:8188'
  
  console.log(`🔍 Testing ComfyUI connection at ${comfyUrl}...`)
  
  try {
    // Test basic connection
    const response = await axios.get(`${comfyUrl}/system_stats`)
    console.log('✅ ComfyUI is running!')
    console.log('\nSystem info:')
    console.log(`- OS: ${response.data.system.os}`)
    console.log(`- Python: ${response.data.system.python_version}`)
    
    if (response.data.devices && response.data.devices.length > 0) {
      console.log('\nGPU devices:')
      response.data.devices.forEach((device: any) => {
        console.log(`- ${device.name} (${device.type})`)
        console.log(`  VRAM: ${(device.vram_free / 1024 / 1024 / 1024).toFixed(2)}GB / ${(device.vram_total / 1024 / 1024 / 1024).toFixed(2)}GB`)
      })
    }
    
    // Test ComfyUI client
    console.log('\n🔍 Testing ComfyUI client...')
    const client = new ComfyUIClient({ url: comfyUrl })
    await client.init()
    console.log('✅ ComfyUI client initialized successfully!')
    
    // Test workflow
    console.log('\n🔍 Testing image generation...')
    console.log('This will generate a test image with prompt: "a beautiful sunset"')
    
    const imageUrl = await client.generateImage({
      prompt: 'a beautiful sunset over mountains, golden hour, cinematic',
      width: 512,
      height: 512,
      steps: 4,
    })
    
    console.log('✅ Image generated successfully!')
    console.log(`Image URL: ${imageUrl}`)
    
    client.disconnect()
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    console.log('\nMake sure ComfyUI is running with:')
    console.log('cd /media/rese/AL/ComfyUI && python main.py --listen')
    process.exit(1)
  }
}

// Run the test
testComfyUI().catch(console.error)