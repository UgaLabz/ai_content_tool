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
    } = req.body

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' })
      return
    }

    // Generate a unique ID for this generation
    const generationId = uuidv4()

    // Emit start event
    io.emit('generation:start', { id: generationId })

    // Start generation
    const imageUrl = await comfyClient.generateImage({
      prompt,
      width,
      height,
      steps,
      seed: seed || Math.floor(Math.random() * 1000000),
      sampler,
      scheduler,
      outputPath,
      filenameOverride,
    })

    // Emit completion event
    io.emit('generation:complete', {
      id: generationId,
      url: imageUrl,
    })

    res.json({
      success: true,
      id: generationId,
      url: imageUrl,
      params: {
        prompt,
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

// Start server
const PORT = process.env.SERVER_PORT || 3001

async function start() {
  await initializeComfyUI()
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  
  httpServer.close(() => {
    if (comfyClient) {
      comfyClient.disconnect()
    }
    process.exit(0)
  })
})

// Start the server
start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})