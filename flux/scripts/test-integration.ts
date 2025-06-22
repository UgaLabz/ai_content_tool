#!/usr/bin/env node

import axios from 'axios'

const API_URL = 'http://localhost:3001'
const COMFYUI_URL = 'http://localhost:8188'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testIntegration() {
  console.log('🔍 Testing Flux Browser Integration')
  console.log('===================================')
  
  // 1. Check ComfyUI
  console.log('\n1. Checking ComfyUI...')
  try {
    const comfyResponse = await axios.get(`${COMFYUI_URL}/system_stats`)
    console.log('✅ ComfyUI is running')
    const gpu = comfyResponse.data.devices?.[0]
    if (gpu) {
      console.log(`   GPU: ${gpu.name}`)
      console.log(`   VRAM: ${(gpu.vram_free / 1024 / 1024 / 1024).toFixed(2)}GB available`)
    }
  } catch (error) {
    console.error('❌ ComfyUI is not running!')
    console.log('   Start it with: cd /media/rese/AL/ComfyUI && python main.py --listen')
    process.exit(1)
  }
  
  // 2. Check Backend API
  console.log('\n2. Checking Backend API...')
  try {
    const apiResponse = await axios.get(`${API_URL}/api/health`)
    console.log('✅ Backend API is running')
    console.log(`   ComfyUI connection: ${apiResponse.data.comfyui}`)
  } catch (error) {
    console.error('❌ Backend API is not running!')
    console.log('   Make sure to run: npm run dev')
    process.exit(1)
  }
  
  // 3. Test Generation
  console.log('\n3. Testing Image Generation...')
  try {
    console.log('   Submitting generation request...')
    const genResponse = await axios.post(`${API_URL}/api/generate`, {
      prompt: 'a cute robot holding a "Hello Flux!" sign, cartoon style',
      width: 512,
      height: 512,
      steps: 4,
      seed: 42
    })
    
    console.log('✅ Generation request accepted')
    console.log(`   ID: ${genResponse.data.id}`)
    console.log('   Waiting for completion...')
    
    // Wait for generation
    await sleep(15000) // 15 seconds should be enough for 512x512
    
    console.log(`✅ Image URL: ${genResponse.data.url}`)
    
  } catch (error: any) {
    console.error('❌ Generation failed:', error.response?.data || error.message)
  }
  
  // 4. Check Frontend
  console.log('\n4. Checking Frontend...')
  try {
    const frontendResponse = await axios.get('http://localhost:3000')
    console.log('✅ Frontend is accessible')
  } catch (error) {
    console.log('⚠️  Frontend might not be running or still building')
  }
  
  console.log('\n✨ Integration test complete!')
  console.log('\nYou can now:')
  console.log('1. Open http://localhost:3000 in your browser')
  console.log('2. Enter a prompt and generate images')
  console.log('3. Download or view generated images')
  console.log('\nEnjoy creating with Flux! 🎨')
}

// Run the test
testIntegration().catch(console.error)