import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/config'
import type { LoraTrainingConfig, LoraTrainingJob, CreateTrainingJobRequest } from '../types/training'

export class TrainingService {
  private static activeJobs = new Map<string, any>()
  
  // Path to kohya_ss installation
  private static KOHYA_PATH = '/media/rese/AL/kohya_ss'
  private static TRAINING_DATA_PATH = '/media/rese/AL/training_data'
  private static OUTPUT_PATH = '/media/rese/AL/models/loras/trained'

  static async createTrainingJob(data: CreateTrainingJobRequest): Promise<LoraTrainingJob> {
    const jobId = uuidv4()
    
    // Create job record in database
    const [id] = await db('lora_training_jobs').insert({
      character_id: data.character_id,
      job_id: jobId,
      status: 'pending',
      config: JSON.stringify(data.config),
      progress: 0,
      created_at: new Date(),
      updated_at: new Date()
    })

    // Create dataset entries
    for (const image of data.images) {
      await db('training_dataset_images').insert({
        job_id: id,
        image_path: image.image_path,
        caption: image.caption || '',
        is_validated: true,
        created_at: new Date(),
        updated_at: new Date()
      })
    }

    // Get the created job
    const job = await this.getTrainingJob(jobId)
    
    // Queue the job for processing
    this.queueJob(job)
    
    return job
  }

  static async getTrainingJob(jobId: string): Promise<LoraTrainingJob> {
    const job = await db('lora_training_jobs')
      .where('job_id', jobId)
      .first()
    
    if (!job) {
      throw new Error('Training job not found')
    }

    return {
      ...job,
      config: JSON.parse(job.config),
      dataset_info: job.dataset_info ? JSON.parse(job.dataset_info) : null,
      created_at: new Date(job.created_at),
      updated_at: new Date(job.updated_at),
      started_at: job.started_at ? new Date(job.started_at) : null,
      completed_at: job.completed_at ? new Date(job.completed_at) : null
    }
  }

  static async getTrainingJobs(characterId?: number): Promise<LoraTrainingJob[]> {
    let query = db('lora_training_jobs')
    
    if (characterId) {
      query = query.where('character_id', characterId)
    }
    
    const jobs = await query.orderBy('created_at', 'desc')
    
    return jobs.map(job => ({
      ...job,
      config: JSON.parse(job.config),
      dataset_info: job.dataset_info ? JSON.parse(job.dataset_info) : null,
      created_at: new Date(job.created_at),
      updated_at: new Date(job.updated_at),
      started_at: job.started_at ? new Date(job.started_at) : null,
      completed_at: job.completed_at ? new Date(job.completed_at) : null
    }))
  }

  static async cancelTrainingJob(jobId: string): Promise<void> {
    // Update job status
    await db('lora_training_jobs')
      .where('job_id', jobId)
      .update({
        status: 'cancelled',
        updated_at: new Date()
      })

    // Kill the process if running
    const process = this.activeJobs.get(jobId)
    if (process) {
      process.kill('SIGTERM')
      this.activeJobs.delete(jobId)
    }
  }

  private static async queueJob(job: LoraTrainingJob) {
    // In a production environment, this would add to a job queue
    // For now, we'll process immediately
    setTimeout(() => this.processJob(job), 1000)
  }

  private static async processJob(job: LoraTrainingJob) {
    try {
      // Update job status to preparing
      await db('lora_training_jobs')
        .where('job_id', job.job_id)
        .update({
          status: 'preparing',
          started_at: new Date(),
          updated_at: new Date()
        })

      // Prepare dataset
      const datasetPath = await this.prepareDataset(job)
      
      // Update dataset info
      const images = await db('training_dataset_images')
        .where('job_id', job.id)
        .select()
      
      await db('lora_training_jobs')
        .where('job_id', job.job_id)
        .update({
          dataset_info: JSON.stringify({
            image_count: images.length,
            total_steps: job.config.max_train_steps,
            estimated_time_minutes: Math.round(job.config.max_train_steps / 60)
          }),
          updated_at: new Date()
        })

      // Start training
      await this.runTraining(job, datasetPath)
      
    } catch (error) {
      console.error('Training job failed:', error)
      await db('lora_training_jobs')
        .where('job_id', job.job_id)
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date(),
          updated_at: new Date()
        })
    }
  }

  private static async prepareDataset(job: LoraTrainingJob): Promise<string> {
    // Create dataset directory
    const datasetPath = path.join(this.TRAINING_DATA_PATH, job.job_id)
    const imagePath = path.join(datasetPath, 'images')
    
    await fs.mkdir(imagePath, { recursive: true })
    
    // Get dataset images
    const images = await db('training_dataset_images')
      .where('job_id', job.id)
      .select()
    
    // Copy images and create caption files
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      const filename = `${i.toString().padStart(4, '0')}.png`
      const captionFile = `${i.toString().padStart(4, '0')}.txt`
      
      // Copy image (in production, this would handle various sources)
      // For now, assume images are already in a accessible location
      
      // Write caption file
      await fs.writeFile(
        path.join(imagePath, captionFile),
        image.caption
      )
    }
    
    return datasetPath
  }

  private static async runTraining(job: LoraTrainingJob, datasetPath: string) {
    // Update status to training
    await db('lora_training_jobs')
      .where('job_id', job.job_id)
      .update({
        status: 'training',
        updated_at: new Date()
      })

    // Prepare training script arguments
    const outputDir = path.join(this.OUTPUT_PATH, job.character_id.toString())
    await fs.mkdir(outputDir, { recursive: true })
    
    const config = job.config as LoraTrainingConfig
    const args = [
      'train_network.py',
      '--pretrained_model_name_or_path', config.pretrained_model_name_or_path || '/media/rese/AL/models/unet/flux1-dev.safetensors',
      '--train_data_dir', path.join(datasetPath, 'images'),
      '--output_dir', outputDir,
      '--output_name', config.output_name,
      '--network_module', 'networks.lora',
      '--network_dim', config.network_dim.toString(),
      '--network_alpha', (config.network_alpha || config.network_dim).toString(),
      '--learning_rate', config.learning_rate.toString(),
      '--train_batch_size', config.train_batch_size.toString(),
      '--max_train_steps', config.max_train_steps.toString(),
      '--save_every_n_steps', (config.save_every_n_steps || 500).toString(),
      '--mixed_precision', config.mixed_precision || 'fp16',
      '--optimizer_type', config.optimizer_type || 'AdamW',
      '--lr_scheduler', config.lr_scheduler || 'cosine',
      '--cache_latents',
      '--caption_extension', '.txt',
      '--resolution', (config.dataset_config?.resolution || 1024).toString(),
    ]

    if (config.gradient_checkpointing) {
      args.push('--gradient_checkpointing')
    }

    // Spawn training process
    const pythonPath = path.join(this.KOHYA_PATH, 'venv/bin/python')
    const process = spawn(pythonPath, args, {
      cwd: this.KOHYA_PATH,
      env: {
        ...process.env,
        CUDA_VISIBLE_DEVICES: '0', // Use first GPU
      }
    })

    this.activeJobs.set(job.job_id, process)

    // Handle process output
    let lastProgress = 0
    process.stdout.on('data', async (data) => {
      const output = data.toString()
      console.log('Training output:', output)
      
      // Parse progress from output
      const stepMatch = output.match(/step (\d+)\/(\d+)/)
      if (stepMatch) {
        const currentStep = parseInt(stepMatch[1])
        const totalSteps = parseInt(stepMatch[2])
        const progress = Math.round((currentStep / totalSteps) * 100)
        
        if (progress !== lastProgress) {
          lastProgress = progress
          await db('lora_training_jobs')
            .where('job_id', job.job_id)
            .update({
              progress,
              training_log: db.raw('training_log || ?', [output + '\n']),
              updated_at: new Date()
            })
          
          // Emit progress event
          if (global.io) {
            global.io.emit('training:progress', {
              job_id: job.job_id,
              progress,
              current_step: currentStep,
              total_steps: totalSteps
            })
          }
        }
      }
    })

    process.stderr.on('data', (data) => {
      console.error('Training error:', data.toString())
    })

    // Wait for process to complete
    await new Promise<void>((resolve, reject) => {
      process.on('exit', async (code) => {
        this.activeJobs.delete(job.job_id)
        
        if (code === 0) {
          // Training completed successfully
          const outputPath = path.join(outputDir, `${config.output_name}.safetensors`)
          
          await db('lora_training_jobs')
            .where('job_id', job.job_id)
            .update({
              status: 'completed',
              output_path: outputPath,
              progress: 100,
              completed_at: new Date(),
              updated_at: new Date()
            })
          
          // Update character with new LoRA path
          await db('characters')
            .where('id', job.character_id)
            .update({
              lora_path: outputPath,
              updated_at: new Date()
            })
          
          // Emit completion event
          if (global.io) {
            global.io.emit('training:complete', {
              job_id: job.job_id,
              output_path: outputPath
            })
          }
          
          resolve()
        } else {
          // Training failed
          await db('lora_training_jobs')
            .where('job_id', job.job_id)
            .update({
              status: 'failed',
              error_message: `Process exited with code ${code}`,
              completed_at: new Date(),
              updated_at: new Date()
            })
          
          if (global.io) {
            global.io.emit('training:error', {
              job_id: job.job_id,
              error: `Process exited with code ${code}`
            })
          }
          
          reject(new Error(`Training failed with exit code ${code}`))
        }
      })
    })
  }
}