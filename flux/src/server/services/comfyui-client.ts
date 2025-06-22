import { WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import * as fs from 'fs/promises'
import * as path from 'path'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

interface ComfyUIConfig {
  url: string
  clientId?: string
}

interface WorkflowParams {
  prompt: string
  width?: number
  height?: number
  steps?: number
  seed?: number
  sampler?: string
  scheduler?: string
  outputPath?: string
  filenameOverride?: string
  lora?: {
    name: string
    strength: number
  }
  negativePrompt?: string
}

interface QueueItem {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number
  result?: string
  error?: string
  outputPath?: string
  filenameOverride?: string
  originalFile?: {
    filename: string
    subfolder: string
    type: string
  }
}

export class ComfyUIClient {
  private url: string
  private clientId: string
  private ws: WebSocket | null = null
  private queue: Map<string, QueueItem> = new Map()
  private workflowTemplate: any
  private loraWorkflowTemplate: any
  private comfyOutputPath: string = process.env.COMFYUI_OUTPUT_PATH || '/media/rese/AL/ComfyUI/output'

  constructor(config: ComfyUIConfig) {
    this.url = config.url || 'http://localhost:8188'
    this.clientId = config.clientId || uuidv4()
  }

  async init() {
    // Load workflow templates
    const workflowPath = path.join(
      process.cwd(),
      'src/server/workflows/flux-schnell-workflow-template.json'
    )
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    this.workflowTemplate = workflowContent

    // Load LoRA workflow template
    const loraWorkflowPath = path.join(
      process.cwd(),
      'src/server/workflows/flux-lora-workflow-template.json'
    )
    const loraWorkflowContent = await fs.readFile(loraWorkflowPath, 'utf-8')
    this.loraWorkflowTemplate = loraWorkflowContent

    // Connect WebSocket
    await this.connectWebSocket()
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.url.replace('http', 'ws') + `/ws?clientId=${this.clientId}`
      
      this.ws = new WebSocket(wsUrl)

      this.ws.on('open', () => {
        console.log('Connected to ComfyUI WebSocket')
        resolve()
      })

      this.ws.on('message', async (data) => {
        await this.handleWebSocketMessage(data.toString())
      })

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        reject(error)
      })

      this.ws.on('close', () => {
        console.log('WebSocket connection closed')
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.connectWebSocket(), 5000)
      })
    })
  }

  private async handleWebSocketMessage(data: string) {
    try {
      const message = JSON.parse(data)
      
      if (message.type === 'executing') {
        const promptId = message.data.prompt_id
        const node = message.data.node
        
        if (promptId && this.queue.has(promptId)) {
          const item = this.queue.get(promptId)!
          
          if (node === null) {
            // Execution completed
            item.status = 'completed'
            item.progress = 100
          } else {
            // Update progress based on node execution
            item.status = 'processing'
            // Simple progress calculation (can be improved)
            item.progress = 50
          }
        }
      } else if (message.type === 'executed') {
        const promptId = message.data.prompt_id
        const outputs = message.data.output
        
        if (promptId && this.queue.has(promptId)) {
          const item = this.queue.get(promptId)!
          
          // Extract image filename from outputs
          if (outputs && outputs.images && outputs.images.length > 0) {
            const image = outputs.images[0]
            // Store original file info
            item.originalFile = {
              filename: image.filename,
              subfolder: image.subfolder || '',
              type: image.type || 'output'
            }
            
            // If custom output path is set, move the file
            if (item.outputPath && item.outputPath !== this.comfyOutputPath) {
              try {
                await this.moveGeneratedFile(item)
              } catch (error) {
                console.error('Failed to move file:', error)
                // Fall back to proxy URL if move fails
                const params = new URLSearchParams({
                  filename: image.filename,
                  subfolder: image.subfolder || '',
                  type: image.type || 'output'
                })
                const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                item.result = `${serverUrl}/api/image/proxy?${params}`
              }
            } else {
              // Use proxy endpoint for default location
              const params = new URLSearchParams({
                filename: image.filename,
                subfolder: image.subfolder || '',
                type: image.type || 'output'
              })
              const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
              item.result = `${serverUrl}/api/image/proxy?${params}`
            }
          }
        }
      } else if (message.type === 'progress') {
        const promptId = message.data.prompt_id
        const value = message.data.value
        const max = message.data.max
        
        if (promptId && this.queue.has(promptId)) {
          const item = this.queue.get(promptId)!
          item.progress = Math.round((value / max) * 100)
        }
      } else if (message.type === 'execution_error') {
        const promptId = message.data.prompt_id
        
        if (promptId && this.queue.has(promptId)) {
          const item = this.queue.get(promptId)!
          item.status = 'error'
          item.error = message.data.exception_message || 'Execution failed'
        }
      } else if (message.type === 'execution_success') {
        const promptId = message.data.prompt_id
        
        if (promptId && this.queue.has(promptId)) {
          const item = this.queue.get(promptId)!
          // Only mark as completed if we have a result
          if (item.result) {
            item.status = 'completed'
          }
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }

  async generateImage(params: WorkflowParams): Promise<string> {
    const promptId = uuidv4()
    
    // Create workflow from template
    const workflow = this.prepareWorkflow(params)
    
    // Add to queue with custom path info
    this.queue.set(promptId, {
      id: promptId,
      status: 'pending',
      progress: 0,
      outputPath: params.outputPath,
      filenameOverride: params.filenameOverride,
    })

    // Submit to ComfyUI
    try {
      const response = await axios.post(`${this.url}/prompt`, {
        prompt: workflow,
        client_id: this.clientId,
      })

      const comfyPromptId = response.data.prompt_id
      
      // Update our promptId mapping
      const item = this.queue.get(promptId)!
      this.queue.delete(promptId)
      this.queue.set(comfyPromptId, item)

      // Wait for completion
      return await this.waitForCompletion(comfyPromptId)
    } catch (error) {
      const item = this.queue.get(promptId)
      if (item) {
        item.status = 'error'
        item.error = error instanceof Error ? error.message : 'Unknown error'
      }
      throw error
    }
  }

  private prepareWorkflow(params: WorkflowParams): any {
    // Choose template based on whether LoRA is used
    const template = params.lora ? this.loraWorkflowTemplate : this.workflowTemplate
    
    // First parse the template
    const workflow = JSON.parse(template)
    
    // Extract the nodes object if it exists (our template format)
    const nodes = workflow.nodes || workflow
    
    if (params.lora) {
      // LoRA workflow node IDs
      nodes["6"].inputs.text = params.prompt // positive prompt
      nodes["9"].inputs.text = params.negativePrompt || '' // negative prompt
      nodes["3"].inputs.steps = params.steps || 4
      nodes["3"].inputs.scheduler = params.scheduler || 'simple'
      nodes["3"].inputs.sampler_name = params.sampler || 'euler'
      nodes["3"].inputs.seed = params.seed || Math.floor(Math.random() * 1000000)
      nodes["5"].inputs.width = params.width || 1024
      nodes["5"].inputs.height = params.height || 1024
      nodes["12"].inputs.lora_name = params.lora.name
      nodes["12"].inputs.strength_model = params.lora.strength
      nodes["12"].inputs.strength_clip = params.lora.strength
    } else {
      // Standard workflow node IDs
      nodes["6"].inputs.text = params.prompt
      nodes["17"].inputs.steps = params.steps || 4
      nodes["17"].inputs.scheduler = params.scheduler || 'simple'
      nodes["16"].inputs.sampler_name = params.sampler || 'euler'
      nodes["25"].inputs.noise_seed = params.seed || Math.floor(Math.random() * 1000000)
      nodes["27"].inputs.width = params.width || 1024
      nodes["27"].inputs.height = params.height || 1024
    }
    
    // Handle filename - if custom filename provided, use it; otherwise generate from prompt
    const saveNodeId = params.lora ? "10" : "9" // Different node ID for LoRA workflow
    if (params.filenameOverride) {
      nodes[saveNodeId].inputs.filename_prefix = params.filenameOverride
    } else {
      // Generate filename from prompt (first 50 chars, alphanumeric only)
      const cleanPrompt = params.prompt
        .substring(0, 50)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase()
      nodes[saveNodeId].inputs.filename_prefix = `flux_${cleanPrompt}_`
    }
    
    // Note: ComfyUI doesn't support custom output paths via API
    // The output path is configured in ComfyUI's settings
    // We'll need to document this limitation
    
    // Return just the nodes object (what ComfyUI expects)
    return nodes
  }

  private async waitForCompletion(promptId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const item = this.queue.get(promptId)
        
        if (!item) {
          clearInterval(checkInterval)
          reject(new Error('Queue item not found'))
          return
        }

        if (item.status === 'completed' && item.result) {
          clearInterval(checkInterval)
          resolve(item.result)
        } else if (item.status === 'error') {
          clearInterval(checkInterval)
          reject(new Error(item.error || 'Generation failed'))
        }
      }, 500)

      // Timeout after 10 minutes (Flux can take 5+ minutes)
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error('Generation timeout'))
      }, 600000)
    })
  }

  getQueueStatus(promptId: string): QueueItem | undefined {
    return this.queue.get(promptId)
  }

  async getSystemStats() {
    try {
      const response = await axios.get(`${this.url}/system_stats`)
      return response.data
    } catch (error) {
      throw new Error('Failed to get system stats')
    }
  }

  async interrupt(promptId: string) {
    try {
      await axios.post(`${this.url}/interrupt`)
      const item = this.queue.get(promptId)
      if (item) {
        item.status = 'error'
        item.error = 'Interrupted by user'
      }
    } catch (error) {
      throw new Error('Failed to interrupt generation')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private async moveGeneratedFile(item: QueueItem): Promise<void> {
    if (!item.originalFile || !item.outputPath) {
      throw new Error('Missing file information for move operation')
    }

    // Construct source path
    const sourcePath = path.join(
      this.comfyOutputPath,
      item.originalFile.subfolder || '',
      item.originalFile.filename
    )

    // Ensure output directory exists
    await fs.mkdir(item.outputPath, { recursive: true })

    // Construct destination filename
    let destFilename = item.originalFile.filename
    if (item.filenameOverride) {
      // Keep the file extension from original
      const ext = path.extname(item.originalFile.filename)
      // Ensure the override doesn't already have an extension
      const baseOverride = item.filenameOverride.replace(/\.[^/.]+$/, '')
      destFilename = `${baseOverride}${ext}`
    }

    const destPath = path.join(item.outputPath, destFilename)

    // Move the file
    try {
      // First try to rename (fastest if on same filesystem)
      await fs.rename(sourcePath, destPath)
    } catch (error) {
      // If rename fails (cross-device), copy and delete
      await pipeline(
        createReadStream(sourcePath),
        createWriteStream(destPath)
      )
      await fs.unlink(sourcePath)
    }

    // Update the result URL to serve from custom location
    // We'll need to add a new endpoint to serve files from custom paths
    const encodedPath = encodeURIComponent(destPath)
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    item.result = `${serverUrl}/api/image/custom?path=${encodedPath}`
  }
}