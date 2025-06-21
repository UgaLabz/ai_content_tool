import { createHash } from 'crypto';
import { logger } from '../../utils/logger';
import { LRUCache } from 'lru-cache';

export interface CacheConfig {
  maxSize?: number;        // Maximum number of items
  maxMemoryMB?: number;    // Maximum memory usage in MB
  ttl?: number;           // Time to live in milliseconds
  updateAgeOnGet?: boolean; // Refresh TTL on access
  allowStale?: boolean;    // Return stale data while refreshing
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  size: number;
  createdAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
  memoryUsage: number;
  hitRate: number;
}

export class CacheService<T = any> {
  private cache: LRUCache<string, CacheEntry<T>>;
  private stats: CacheStats;
  private config: Required<CacheConfig>;
  
  constructor(config?: CacheConfig) {
    this.config = {
      maxSize: config?.maxSize || 1000,
      maxMemoryMB: config?.maxMemoryMB || 100,
      ttl: config?.ttl || 3600000, // 1 hour default
      updateAgeOnGet: config?.updateAgeOnGet !== false,
      allowStale: config?.allowStale !== false,
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      memoryUsage: 0,
      hitRate: 0,
    };
    
    this.cache = new LRUCache<string, CacheEntry<T>>({
      max: this.config.maxSize,
      maxSize: this.config.maxMemoryMB * 1024 * 1024, // Convert to bytes
      sizeCalculation: (entry) => entry.size,
      ttl: this.config.ttl,
      updateAgeOnGet: this.config.updateAgeOnGet,
      allowStale: this.config.allowStale,
      dispose: (value, key, reason) => {
        if (reason === 'evict') {
          this.stats.evictions++;
          logger.debug({ key, reason }, 'Cache entry evicted');
        }
      },
    });
  }
  
  /**
   * Generate cache key from multiple inputs
   */
  generateKey(...inputs: any[]): string {
    const hash = createHash('sha256');
    for (const input of inputs) {
      if (typeof input === 'object') {
        hash.update(JSON.stringify(input));
      } else {
        hash.update(String(input));
      }
    }
    return hash.digest('hex').substring(0, 16);
  }
  
  /**
   * Get value from cache
   */
  async get(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    
    if (entry) {
      this.stats.hits++;
      entry.accessCount++;
      entry.lastAccessed = new Date();
      
      logger.debug({ 
        key, 
        accessCount: entry.accessCount,
        age: Date.now() - entry.createdAt.getTime()
      }, 'Cache hit');
      
      return entry.value;
    }
    
    this.stats.misses++;
    logger.debug({ key }, 'Cache miss');
    return undefined;
  }
  
  /**
   * Set value in cache
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    const size = this.calculateSize(value);
    
    const entry: CacheEntry<T> = {
      key,
      value,
      size,
      createdAt: new Date(),
      accessCount: 0,
      lastAccessed: new Date(),
    };
    
    this.cache.set(key, entry, { ttl: ttl || this.config.ttl });
    this.stats.sets++;
    this.updateStats();
    
    logger.debug({ key, size, ttl: ttl || this.config.ttl }, 'Cache set');
  }
  
  /**
   * Get or set value with factory function
   */
  async getOrSet(
    key: string, 
    factory: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }
  
  /**
   * Delete entry from cache
   */
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateStats();
      logger.debug({ key }, 'Cache entry deleted');
    }
    return deleted;
  }
  
  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      memoryUsage: 0,
      hitRate: 0,
    };
    logger.info('Cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }
  
  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Prune expired entries
   */
  prune(): number {
    const beforeSize = this.cache.size;
    this.cache.purgeStale();
    const pruned = beforeSize - this.cache.size;
    
    if (pruned > 0) {
      this.updateStats();
      logger.info({ pruned }, 'Cache entries pruned');
    }
    
    return pruned;
  }
  
  /**
   * Calculate size of value in bytes
   */
  private calculateSize(value: T): number {
    if (typeof value === 'string') {
      return value.length * 2; // Approximate UTF-16 size
    } else if (Buffer.isBuffer(value)) {
      return value.length;
    } else if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    } else {
      return 8; // Default size for primitives
    }
  }
  
  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.memoryUsage = this.cache.calculatedSize || 0;
    
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

// Specialized cache implementations

export class PromptCache extends CacheService<string> {
  constructor() {
    super({
      maxSize: 5000,
      maxMemoryMB: 50,
      ttl: 3600000, // 1 hour
      updateAgeOnGet: true,
    });
  }
  
  /**
   * Generate key for prompt caching
   */
  generatePromptKey(
    prompt: string,
    model: string,
    options?: any
  ): string {
    return this.generateKey(prompt, model, options);
  }
}

export class EmbeddingCache extends CacheService<number[]> {
  constructor() {
    super({
      maxSize: 10000,
      maxMemoryMB: 200,
      ttl: 86400000, // 24 hours
      updateAgeOnGet: true,
    });
  }
  
  /**
   * Generate key for embedding caching
   */
  generateEmbeddingKey(text: string, model: string): string {
    return this.generateKey(text, model);
  }
}

export class ModelStateCache extends CacheService<any> {
  constructor() {
    super({
      maxSize: 10,
      maxMemoryMB: 500,
      ttl: 600000, // 10 minutes
      updateAgeOnGet: false,
      allowStale: false,
    });
  }
  
  /**
   * Generate key for model state caching
   */
  generateModelKey(provider: string, modelId: string): string {
    return `${provider}:${modelId}`;
  }
}