export interface LoraTrainingConfig {
  // Basic settings
  network_dim: number // LoRA rank (4-128, typically 16-32)
  network_alpha: number // Usually same as network_dim
  learning_rate: number // 1e-4 to 1e-6
  text_encoder_lr?: number // Optional separate learning rate
  unet_lr?: number // Optional separate learning rate
  
  // Training parameters
  train_batch_size: number // Usually 1-4 for consumer GPUs
  max_train_steps: number // 1000-5000 typical
  save_every_n_steps?: number // Save checkpoints
  
  // Model settings
  pretrained_model_name_or_path: string // Base model path
  output_dir: string // Where to save LoRA
  output_name: string // LoRA filename
  
  // Optimization
  optimizer_type?: string // AdamW, AdamW8bit, etc
  lr_scheduler?: string // cosine, linear, etc
  lr_warmup_steps?: number
  
  // Advanced settings
  clip_skip?: number // 1 or 2
  max_token_length?: number // 75, 150, 225
  gradient_checkpointing?: boolean
  gradient_accumulation_steps?: number
  mixed_precision?: 'no' | 'fp16' | 'bf16'
  
  // Regularization
  prior_loss_weight?: number
  min_snr_gamma?: number
  noise_offset?: number
  
  // Dataset
  dataset_config?: {
    resolution: number // 512, 768, 1024
    center_crop?: boolean
    random_crop?: boolean
    caption_extension?: string
    keep_tokens?: number
    shuffle_caption?: boolean
    cache_latents?: boolean
  }
}

export interface LoraTrainingJob {
  id: number
  character_id: number
  job_id: string
  status: 'pending' | 'preparing' | 'training' | 'completed' | 'failed' | 'cancelled'
  config: LoraTrainingConfig
  dataset_info?: {
    image_count: number
    total_steps: number
    estimated_time_minutes: number
  }
  output_path?: string
  error_message?: string
  progress: number
  training_log?: string
  started_at?: Date
  completed_at?: Date
  created_at: Date
  updated_at: Date
}

export interface TrainingDatasetImage {
  id: number
  job_id: number
  image_path: string
  caption: string
  preprocessing?: {
    crop?: { x: number; y: number; width: number; height: number }
    background_removed?: boolean
    resized?: { width: number; height: number }
  }
  is_validated: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateTrainingJobRequest {
  character_id: number
  config: Partial<LoraTrainingConfig>
  images: Array<{
    image_path: string
    caption?: string
  }>
}

export interface TrainingProgress {
  job_id: string
  progress: number
  current_step: number
  total_steps: number
  loss?: number
  learning_rate?: number
  samples_per_second?: number
  eta_minutes?: number
  log_entry?: string
}