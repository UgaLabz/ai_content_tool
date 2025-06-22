import * as fs from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { CharacterModel } from '../models/character.model'
import type { LoraModel } from '../types/character'

interface LoraFileInfo {
  name: string
  path: string
  size: number
  modified: Date
}

export class LoraScanner {
  private static readonly LORA_PATHS = [
    '/media/rese/AL/models/loras',
    '/media/rese/AL/ComfyUI/models/loras',
    '/media/rese/AL/flux/loras'
  ]

  private static readonly SUPPORTED_EXTENSIONS = ['.safetensors', '.ckpt', '.pt']

  /**
   * Scan all LoRA directories and update database
   */
  static async scanAndUpdateLoraModels(): Promise<LoraModel[]> {
    const discoveredLoras: LoraFileInfo[] = []
    
    // Scan each directory
    for (const loraPath of this.LORA_PATHS) {
      if (existsSync(loraPath)) {
        try {
          const files = await this.scanDirectory(loraPath)
          discoveredLoras.push(...files)
        } catch (error) {
          console.error(`Failed to scan LoRA directory ${loraPath}:`, error)
        }
      }
    }

    // Update database with discovered LoRAs
    const dbLoras = await CharacterModel.getLoraModels()
    const dbLorasPaths = new Set(dbLoras.map(l => l.file_path))
    
    // Add new LoRAs to database
    const addedLoras: LoraModel[] = []
    for (const lora of discoveredLoras) {
      if (!dbLorasPaths.has(lora.path)) {
        try {
          const newLora = await CharacterModel.addLoraModel({
            name: this.extractLoraName(lora.name),
            file_path: lora.path,
            description: `Auto-discovered LoRA model (${this.formatFileSize(lora.size)})`,
            base_model: 'flux',
            metadata: {
              file_size: lora.size,
              discovered_at: new Date(),
              auto_discovered: true
            }
          })
          addedLoras.push(newLora)
        } catch (error) {
          console.error(`Failed to add LoRA ${lora.name} to database:`, error)
        }
      }
    }

    console.log(`LoRA scan complete. Found ${discoveredLoras.length} files, added ${addedLoras.length} new models`)
    
    // Return all LoRAs from database
    return CharacterModel.getLoraModels()
  }

  /**
   * Scan a directory for LoRA files
   */
  private static async scanDirectory(dirPath: string): Promise<LoraFileInfo[]> {
    const loraFiles: LoraFileInfo[] = []
    
    try {
      const files = await fs.readdir(dirPath)
      
      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = await fs.stat(filePath)
        
        if (stats.isFile()) {
          const ext = path.extname(file).toLowerCase()
          if (this.SUPPORTED_EXTENSIONS.includes(ext)) {
            loraFiles.push({
              name: file,
              path: filePath,
              size: stats.size,
              modified: stats.mtime
            })
          }
        } else if (stats.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(filePath)
          loraFiles.push(...subFiles)
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error)
    }
    
    return loraFiles
  }

  /**
   * Extract a clean name from filename
   */
  private static extractLoraName(filename: string): string {
    // Remove extension
    let name = filename.replace(/\.(safetensors|ckpt|pt)$/i, '')
    
    // Replace underscores and hyphens with spaces
    name = name.replace(/[_-]/g, ' ')
    
    // Remove version numbers like v1.0, v2, etc
    name = name.replace(/\s*v?\d+(\.\d+)?$/i, '')
    
    // Capitalize words
    name = name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    
    return name
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  /**
   * Check if a LoRA file exists
   */
  static async verifyLoraExists(loraPath: string): Promise<boolean> {
    try {
      await fs.access(loraPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get ComfyUI-compatible LoRA name
   */
  static getComfyUILoraName(loraPath: string): string {
    // ComfyUI expects just the filename, not the full path
    return path.basename(loraPath)
  }
}