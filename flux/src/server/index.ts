import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import axios from 'axios'
import { ComfyUIClient } from './services/comfyui-client'
import * as fs from 'fs/promises'
import { existsSync, createReadStream } from 'fs'
import { initializeDatabase, closeDatabase } from './db/config'
import { CharacterModel } from './models/character.model'

// Load environment variables
dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')))
app.use('/generated', express.static(path.join(__dirname, '../../public/generated')))

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'))
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

// Initialize ComfyUI client
let comfyClient: ComfyUIClient

async function initializeComfyUI() {
  comfyClient = new ComfyUIClient({
    url: process.env.COMFYUI_URL || 'http://localhost:8188',
  })
  
  try {
    await comfyClient.init()
    console.log('✅ ComfyUI client initialized')
  } catch (error) {
    console.error('❌ Failed to initialize ComfyUI client:', error)
    // Don't exit, allow server to run even if ComfyUI is not available
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    comfyui: comfyClient ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  })
})

// System stats
app.get('/api/system', async (req, res) => {
  try {
    if (!comfyClient) {
      throw new Error('ComfyUI client not initialized')
    }
    
    const stats = await comfyClient.getSystemStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get system stats',
    })
  }
})

// Generate image
app.post('/api/generate', async (req, res) => {
  try {
    if (!comfyClient) {
      throw new Error('ComfyUI client not initialized')
    }

    const {
      prompt,
      width = 1024,
      height = 1024,
      steps = 4,
      seed,
      sampler = 'euler',
      scheduler = 'simple',
      outputPath,
      filenameOverride,
      characterId,
      referenceImage,
    } = req.body

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' })
      return
    }

    // Generate a unique ID for this generation
    const generationId = uuidv4()

    // Emit start event
    io.emit('generation:start', { id: generationId })

    // Prepare generation parameters
    let finalPrompt = prompt
    let negativePrompt = ''
    let loraConfig = undefined
    let ipAdapterConfig = undefined

    // Handle reference image configuration
    if (referenceImage && referenceImage.enabled && referenceImage.imagePath) {
      ipAdapterConfig = {
        imagePath: referenceImage.imagePath,
        strength: referenceImage.strength || 0.85,
        startPercent: (referenceImage.startPercent || 0) / 100,
        endPercent: (referenceImage.endPercent || 100) / 100
      }
      
      // Adjust prompt based on reference mode
      if (referenceImage.mode === 'style') {
        finalPrompt = `${prompt}, in the style of the reference image`
      } else if (referenceImage.mode === 'character') {
        finalPrompt = `${prompt}, featuring the character from the reference image`
      }
    }

    // If character is specified, load character data
    if (characterId) {
      try {
        const character = await CharacterModel.findById(characterId)
        
        // Combine character base prompt with user prompt
        finalPrompt = `${character.base_prompt}, ${prompt}`
        
        // Use character's negative prompt
        negativePrompt = character.negative_prompt || ''
        
        // Check if character has LoRA
        if (character.lora_path) {
          // Verify LoRA file exists
          const { LoraScanner } = await import('./services/lora-scanner')
          const loraExists = await LoraScanner.verifyLoraExists(character.lora_path)
          
          if (loraExists) {
            loraConfig = {
              name: LoraScanner.getComfyUILoraName(character.lora_path),
              strength: character.lora_strength || 0.8
            }
          } else {
            console.warn(`LoRA file not found for character ${characterId}: ${character.lora_path}`)
          }
        }
      } catch (error) {
        console.error('Failed to load character:', error)
        // Continue without character data
      }
    }

    // Start generation
    const imageUrl = await comfyClient.generateImage({
      prompt: finalPrompt,
      width,
      height,
      steps,
      seed: seed || Math.floor(Math.random() * 1000000),
      sampler,
      scheduler,
      outputPath,
      filenameOverride,
      lora: loraConfig,
      negativePrompt,
      ipAdapter: ipAdapterConfig,
    })

    // Emit completion event
    io.emit('generation:complete', {
      id: generationId,
      url: imageUrl,
    })

    // Save to generation history if character was used
    if (characterId) {
      try {
        await CharacterModel.addToHistory({
          character_id: characterId,
          image_path: imageUrl,
          prompt: finalPrompt,
          parameters: {
            width,
            height,
            steps,
            seed: seed || Math.floor(Math.random() * 1000000),
            sampler,
            scheduler,
          },
          workflow_type: loraConfig ? 'lora' : 'standard'
        })
      } catch (error) {
        console.error('Failed to save generation history:', error)
      }
    }

    res.json({
      success: true,
      id: generationId,
      url: imageUrl,
      params: {
        prompt: finalPrompt,
        width,
        height,
        steps,
        seed,
        sampler,
        scheduler,
      },
    })
  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Generation failed',
    })
  }
})

// Get generation status
app.get('/api/status/:id', (req, res) => {
  try {
    if (!comfyClient) {
      throw new Error('ComfyUI client not initialized')
    }

    const status = comfyClient.getQueueStatus(req.params.id)
    
    if (!status) {
      res.status(404).json({ error: 'Generation not found' })
      return
    }

    res.json(status)
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get status',
    })
  }
})

// Cancel generation
app.post('/api/cancel/:id', async (req, res) => {
  try {
    if (!comfyClient) {
      throw new Error('ComfyUI client not initialized')
    }

    await comfyClient.interrupt(req.params.id)
    
    io.emit('generation:cancelled', { id: req.params.id })
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to cancel generation',
    })
  }
})

// Upload image (for future image-to-image features)
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    res.json({
      success: true,
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
    })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Upload failed',
    })
  }
})

// Proxy endpoint for ComfyUI images
app.get('/api/image/proxy', async (req, res) => {
  try {
    const { filename, subfolder, type } = req.query
    
    if (!filename) {
      res.status(400).json({ error: 'Filename required' })
      return
    }
    
    // Build ComfyUI URL
    const params = new URLSearchParams({
      filename: filename as string,
      subfolder: subfolder as string || '',
      type: type as string || 'output'
    })
    
    const imageUrl = `${process.env.COMFYUI_URL || 'http://localhost:8188'}/view?${params}`
    
    // Fetch image from ComfyUI
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      headers: {
        'Accept': 'image/*'
      }
    })
    
    // Set appropriate headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    
    // Stream the image
    response.data.pipe(res)
  } catch (error) {
    console.error('Image proxy error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch image',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Serve image from custom path
app.get('/api/image/custom', async (req, res) => {
  try {
    const { path: imagePath } = req.query
    
    if (!imagePath || typeof imagePath !== 'string') {
      res.status(400).json({ error: 'Path required' })
      return
    }
    
    // Decode the path
    const decodedPath = decodeURIComponent(imagePath)
    
    // Security check - ensure the path exists and is a file
    try {
      const stats = await fs.stat(decodedPath)
      if (!stats.isFile()) {
        res.status(400).json({ error: 'Path is not a file' })
        return
      }
    } catch (error) {
      res.status(404).json({ error: 'File not found' })
      return
    }
    
    // Determine content type from extension
    const ext = path.extname(decodedPath).toLowerCase()
    const contentType = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp'
    }[ext] || 'application/octet-stream'
    
    // Set headers
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    
    // Stream the file
    const stream = createReadStream(decodedPath)
    stream.pipe(res)
    
    stream.on('error', (error) => {
      console.error('Error streaming file:', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream file' })
      }
    })
  } catch (error) {
    console.error('Custom image error:', error)
    res.status(500).json({ 
      error: 'Failed to serve image',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Delete image from ComfyUI or custom location
app.delete('/api/image/:filename', async (req, res) => {
  try {
    const { filename } = req.params
    const { subfolder = '', type = 'output', customPath } = req.query
    
    if (!filename && !customPath) {
      res.status(400).json({ error: 'Filename or custom path required' })
      return
    }
    
    // If custom path is provided, delete from custom location
    if (customPath && typeof customPath === 'string') {
      try {
        const decodedPath = decodeURIComponent(customPath)
        await fs.unlink(decodedPath)
        res.json({ success: true, message: 'Image deleted successfully' })
        return
      } catch (error) {
        console.error('Failed to delete custom path image:', error)
        res.status(500).json({ 
          error: 'Failed to delete image',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
        return
      }
    }
    
    // Otherwise, delete from ComfyUI
    const deleteUrl = `${process.env.COMFYUI_URL || 'http://localhost:8188'}/api/images`
    
    // Send delete request to ComfyUI
    await axios.post(deleteUrl, {
      action: 'delete',
      images: [{
        filename: filename,
        subfolder: subfolder || '',
        type: type || 'output'
      }]
    })
    
    res.json({ success: true, message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Image deletion error:', error)
    res.status(500).json({ 
      error: 'Failed to delete image',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get current output path
app.get('/api/output-path', (req, res) => {
  const defaultPath = process.env.COMFYUI_OUTPUT_PATH || '/media/rese/AL/ComfyUI/output'
  res.json({ path: defaultPath })
})

// List images from output folder
app.get('/api/images', async (req, res) => {
  try {
    const outputPath = req.query.path as string || '/media/rese/AL/ComfyUI/output'
    
    // Check if directory exists
    try {
      const stats = await fs.stat(outputPath)
      if (!stats.isDirectory()) {
        res.json({ images: [] })
        return
      }
    } catch (error) {
      res.json({ images: [] })
      return
    }
    
    // Read directory contents
    const files = await fs.readdir(outputPath)
    
    // Filter for image files and get their info
    const imageFiles = files.filter(file => 
      /\.(png|jpg|jpeg|webp)$/i.test(file)
    )
    
    const images = await Promise.all(
      imageFiles.map(async (filename) => {
        const filePath = path.join(outputPath, filename)
        const stats = await fs.stat(filePath)
        
        // Determine if this is a custom path or ComfyUI output
        const isCustomPath = outputPath !== '/media/rese/AL/ComfyUI/output'
        
        const serverUrl = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${PORT}`
        
        return {
          id: filename.replace(/\.[^/.]+$/, ''), // Remove extension for ID
          filename,
          url: isCustomPath 
            ? `${serverUrl}/api/image/custom?path=${encodeURIComponent(filePath)}`
            : `${serverUrl}/api/image/proxy?filename=${encodeURIComponent(filename)}&type=output`,
          path: filePath,
          size: stats.size,
          modified: stats.mtime,
          isCustomPath
        }
      })
    )
    
    // Sort by modified date, newest first
    images.sort((a, b) => b.modified.getTime() - a.modified.getTime())
    
    res.json({ 
      images: images.slice(0, 50), // Limit to 50 most recent
      total: images.length,
      path: outputPath
    })
  } catch (error) {
    console.error('Failed to list images:', error)
    res.status(500).json({ 
      error: 'Failed to list images',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Browse folder endpoint
app.post('/api/browse-folder', async (req, res) => {
  try {
    const { currentPath } = req.body
    
    // For security, we'll just validate the path exists
    // In a real implementation, you might want to use a file dialog library
    if (!currentPath) {
      res.status(400).json({ error: 'Current path required' })
      return
    }
    
    // Check if path exists and is a directory
    try {
      const stats = await fs.stat(currentPath)
      if (!stats.isDirectory()) {
        res.status(400).json({ error: 'Path is not a directory' })
        return
      }
      
      // Return the validated path
      res.json({ path: currentPath })
    } catch (error) {
      // Path doesn't exist, try parent directory
      const parentPath = path.dirname(currentPath)
      if (existsSync(parentPath)) {
        res.json({ path: parentPath })
      } else {
        res.json({ path: '/media/rese/AL/ComfyUI/output' })
      }
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to browse folder',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Character API endpoints
app.post('/api/characters', async (req, res) => {
  try {
    const character = await CharacterModel.create(req.body)
    res.json(character)
  } catch (error) {
    console.error('Failed to create character:', error)
    res.status(500).json({ 
      error: 'Failed to create character',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.get('/api/characters', async (req, res) => {
  try {
    const characters = await CharacterModel.findAll()
    res.json(characters)
  } catch (error) {
    console.error('Failed to fetch characters:', error)
    res.status(500).json({ 
      error: 'Failed to fetch characters',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.get('/api/characters/:id', async (req, res) => {
  try {
    const character = await CharacterModel.findByIdWithImages(parseInt(req.params.id))
    res.json(character)
  } catch (error) {
    console.error('Failed to fetch character:', error)
    res.status(500).json({ 
      error: 'Failed to fetch character',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.put('/api/characters/:id', async (req, res) => {
  try {
    const character = await CharacterModel.update(parseInt(req.params.id), req.body)
    res.json(character)
  } catch (error) {
    console.error('Failed to update character:', error)
    res.status(500).json({ 
      error: 'Failed to update character',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.delete('/api/characters/:id', async (req, res) => {
  try {
    await CharacterModel.delete(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Failed to delete character:', error)
    res.status(500).json({ 
      error: 'Failed to delete character',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Character image endpoints
app.post('/api/characters/:id/images', async (req, res) => {
  try {
    const { image_path, thumbnail_path, prompt_used, parameters, is_primary } = req.body
    const image = await CharacterModel.addImage(
      parseInt(req.params.id),
      image_path,
      { thumbnail_path, prompt_used, parameters, is_primary }
    )
    res.json(image)
  } catch (error) {
    console.error('Failed to add character image:', error)
    res.status(500).json({ 
      error: 'Failed to add character image',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.put('/api/characters/:id/images/:imageId/primary', async (req, res) => {
  try {
    await CharacterModel.setPrimaryImage(
      parseInt(req.params.id),
      parseInt(req.params.imageId)
    )
    res.json({ success: true })
  } catch (error) {
    console.error('Failed to set primary image:', error)
    res.status(500).json({ 
      error: 'Failed to set primary image',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.delete('/api/characters/images/:imageId', async (req, res) => {
  try {
    await CharacterModel.deleteImage(parseInt(req.params.imageId))
    res.json({ success: true })
  } catch (error) {
    console.error('Failed to delete character image:', error)
    res.status(500).json({ 
      error: 'Failed to delete character image',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Generation history endpoint
app.get('/api/generation-history', async (req, res) => {
  try {
    const characterId = req.query.character_id ? parseInt(req.query.character_id as string) : undefined
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
    const history = await CharacterModel.getHistory(characterId, limit)
    res.json(history)
  } catch (error) {
    console.error('Failed to fetch generation history:', error)
    res.status(500).json({ 
      error: 'Failed to fetch generation history',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// LoRA models endpoint
app.get('/api/lora-models', async (req, res) => {
  try {
    const models = await CharacterModel.getLoraModels()
    res.json(models)
  } catch (error) {
    console.error('Failed to fetch LoRA models:', error)
    res.status(500).json({ 
      error: 'Failed to fetch LoRA models',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Scan for LoRA models
app.post('/api/lora-models/scan', async (req, res) => {
  try {
    const { LoraScanner } = await import('./services/lora-scanner')
    const models = await LoraScanner.scanAndUpdateLoraModels()
    res.json({
      success: true,
      count: models.length,
      models
    })
  } catch (error) {
    console.error('Failed to scan LoRA models:', error)
    res.status(500).json({ 
      error: 'Failed to scan LoRA models',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Style presets endpoints
app.get('/api/characters/:id/style-presets', async (req, res) => {
  try {
    const presets = await CharacterModel.getStylePresets(parseInt(req.params.id))
    res.json(presets)
  } catch (error) {
    console.error('Failed to fetch style presets:', error)
    res.status(500).json({ 
      error: 'Failed to fetch style presets',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.post('/api/characters/:id/style-presets', async (req, res) => {
  try {
    const preset = await CharacterModel.addStylePreset(parseInt(req.params.id), req.body)
    res.json(preset)
  } catch (error) {
    console.error('Failed to add style preset:', error)
    res.status(500).json({ 
      error: 'Failed to add style preset',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Start server
const PORT = process.env.SERVER_PORT || 3001

async function start() {
  // Initialize database
  await initializeDatabase()
  
  // Initialize ComfyUI connection
  await initializeComfyUI()
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  
  httpServer.close(async () => {
    if (comfyClient) {
      comfyClient.disconnect()
    }
    await closeDatabase()
    process.exit(0)
  })
})

// Start the server
start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})