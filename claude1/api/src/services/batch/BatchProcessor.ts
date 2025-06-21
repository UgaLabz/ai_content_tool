import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

export interface BatchConfig {
  maxBatchSize: number;      // Maximum items per batch
  maxWaitTime: number;       // Maximum time to wait before processing (ms)
  concurrency: number;       // Number of concurrent batch processors
  retryAttempts?: number;    // Number of retry attempts for failed batches
  retryDelay?: number;       // Delay between retries (ms)
}

export interface BatchItem<T, R> {
  id: string;
  data: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
  timestamp: Date;
  attempts: number;
}

export interface BatchResult<R> {
  id: string;
  success: boolean;
  result?: R;
  error?: Error;
}

export interface BatchStats {
  totalBatches: number;
  successfulBatches: number;
  failedBatches: number;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  averageBatchSize: number;
  averageWaitTime: number;
  averageProcessingTime: number;
}

export abstract class BatchProcessor<T, R> extends EventEmitter {
  protected config: Required<BatchConfig>;
  protected queue: BatchItem<T, R>[] = [];
  protected processing: Set<string> = new Set();
  protected stats: BatchStats;
  protected batchTimer?: NodeJS.Timeout;
  protected isShuttingDown: boolean = false;
  
  constructor(config: BatchConfig) {
    super();
    
    this.config = {
      maxBatchSize: config.maxBatchSize,
      maxWaitTime: config.maxWaitTime,
      concurrency: config.concurrency,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };
    
    this.stats = {
      totalBatches: 0,
      successfulBatches: 0,
      failedBatches: 0,
      totalItems: 0,
      successfulItems: 0,
      failedItems: 0,
      averageBatchSize: 0,
      averageWaitTime: 0,
      averageProcessingTime: 0,
    };
  }
  
  /**
   * Add item to batch queue
   */
  async add(data: T): Promise<R> {
    if (this.isShuttingDown) {
      throw new Error('Batch processor is shutting down');
    }
    
    return new Promise<R>((resolve, reject) => {
      const item: BatchItem<T, R> = {
        id: this.generateId(),
        data,
        resolve,
        reject,
        timestamp: new Date(),
        attempts: 0,
      };
      
      this.queue.push(item);
      this.stats.totalItems++;
      
      logger.debug({ 
        itemId: item.id, 
        queueSize: this.queue.length 
      }, 'Item added to batch queue');
      
      this.scheduleBatch();
    });
  }
  
  /**
   * Process multiple items as a batch
   */
  async addBatch(items: T[]): Promise<R[]> {
    const promises = items.map(item => this.add(item));
    return Promise.all(promises);
  }
  
  /**
   * Get current statistics
   */
  getStats(): BatchStats {
    return { ...this.stats };
  }
  
  /**
   * Flush pending items immediately
   */
  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }
    
    while (this.queue.length > 0) {
      await this.processBatch();
    }
  }
  
  /**
   * Shutdown the batch processor
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down batch processor');
    this.isShuttingDown = true;
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // Process remaining items
    await this.flush();
    
    // Wait for processing to complete
    while (this.processing.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.emit('shutdown');
    logger.info('Batch processor shut down');
  }
  
  /**
   * Schedule batch processing
   */
  protected scheduleBatch(): void {
    // Process immediately if batch is full
    if (this.queue.length >= this.config.maxBatchSize) {
      this.processBatch();
      return;
    }
    
    // Schedule batch processing if not already scheduled
    if (!this.batchTimer && this.queue.length > 0) {
      this.batchTimer = setTimeout(() => {
        this.batchTimer = undefined;
        this.processBatch();
      }, this.config.maxWaitTime);
    }
  }
  
  /**
   * Process a batch of items
   */
  protected async processBatch(): Promise<void> {
    if (this.processing.size >= this.config.concurrency) {
      // Wait for a slot to become available
      setTimeout(() => this.processBatch(), 100);
      return;
    }
    
    // Get items for batch
    const batchSize = Math.min(this.queue.length, this.config.maxBatchSize);
    if (batchSize === 0) return;
    
    const batch = this.queue.splice(0, batchSize);
    const batchId = this.generateId();
    
    this.processing.add(batchId);
    this.stats.totalBatches++;
    
    // Calculate wait times
    const now = Date.now();
    const waitTimes = batch.map(item => now - item.timestamp.getTime());
    const avgWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
    this.updateAverageWaitTime(avgWaitTime);
    
    logger.debug({ 
      batchId, 
      batchSize, 
      avgWaitTime 
    }, 'Processing batch');
    
    const startTime = Date.now();
    
    try {
      // Process batch with retries
      const results = await this.processWithRetries(batch, batchId);
      
      // Update statistics
      const processingTime = Date.now() - startTime;
      this.updateAverageProcessingTime(processingTime);
      this.updateAverageBatchSize(batchSize);
      
      // Resolve/reject individual items
      for (const result of results) {
        const item = batch.find(i => i.id === result.id);
        if (!item) continue;
        
        if (result.success) {
          this.stats.successfulItems++;
          item.resolve(result.result!);
        } else {
          this.stats.failedItems++;
          item.reject(result.error || new Error('Batch processing failed'));
        }
      }
      
      this.stats.successfulBatches++;
      this.emit('batchComplete', { batchId, results });
      
    } catch (error) {
      logger.error({ error, batchId }, 'Batch processing failed');
      this.stats.failedBatches++;
      
      // Reject all items in batch
      for (const item of batch) {
        this.stats.failedItems++;
        item.reject(error as Error);
      }
      
      this.emit('batchError', { batchId, error });
      
    } finally {
      this.processing.delete(batchId);
      
      // Process next batch if items are waiting
      if (this.queue.length > 0 && !this.isShuttingDown) {
        this.scheduleBatch();
      }
    }
  }
  
  /**
   * Process batch with retry logic
   */
  protected async processWithRetries(
    batch: BatchItem<T, R>[],
    batchId: string
  ): Promise<BatchResult<R>[]> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // Update attempt count
        batch.forEach(item => item.attempts = attempt);
        
        // Call abstract process method
        const results = await this.processBatchItems(
          batch.map(item => ({ id: item.id, data: item.data })),
          batchId
        );
        
        return results;
        
      } catch (error: any) {
        lastError = error;
        logger.warn({ 
          error, 
          batchId, 
          attempt, 
          maxAttempts: this.config.retryAttempts 
        }, 'Batch processing attempt failed');
        
        if (attempt < this.config.retryAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * attempt)
          );
        }
      }
    }
    
    throw lastError || new Error('Max retry attempts exceeded');
  }
  
  /**
   * Update average wait time
   */
  protected updateAverageWaitTime(waitTime: number): void {
    const weight = 0.9; // Exponential moving average
    this.stats.averageWaitTime = 
      this.stats.averageWaitTime * weight + waitTime * (1 - weight);
  }
  
  /**
   * Update average processing time
   */
  protected updateAverageProcessingTime(processingTime: number): void {
    const weight = 0.9;
    this.stats.averageProcessingTime = 
      this.stats.averageProcessingTime * weight + processingTime * (1 - weight);
  }
  
  /**
   * Update average batch size
   */
  protected updateAverageBatchSize(batchSize: number): void {
    const weight = 0.9;
    this.stats.averageBatchSize = 
      this.stats.averageBatchSize * weight + batchSize * (1 - weight);
  }
  
  /**
   * Generate unique ID
   */
  protected generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Abstract method to process batch items
   */
  protected abstract processBatchItems(
    items: Array<{ id: string; data: T }>,
    batchId: string
  ): Promise<BatchResult<R>[]>;
}

// Example implementation for text generation batching
export class TextGenerationBatchProcessor extends BatchProcessor<
  { prompt: string; options?: any },
  string
> {
  constructor(private provider: any) {
    super({
      maxBatchSize: 10,
      maxWaitTime: 100, // 100ms
      concurrency: 3,
      retryAttempts: 2,
    });
  }
  
  protected async processBatchItems(
    items: Array<{ id: string; data: { prompt: string; options?: any } }>,
    batchId: string
  ): Promise<BatchResult<string>[]> {
    // Implementation depends on provider's batch API
    // This is a simplified example
    const results: BatchResult<string>[] = [];
    
    for (const item of items) {
      try {
        const result = await this.provider.generate(
          item.data.prompt,
          item.data.options
        );
        
        results.push({
          id: item.id,
          success: true,
          result,
        });
      } catch (error: any) {
        results.push({
          id: item.id,
          success: false,
          error,
        });
      }
    }
    
    return results;
  }
}