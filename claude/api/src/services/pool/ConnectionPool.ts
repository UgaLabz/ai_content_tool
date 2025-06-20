import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

export interface PoolConfig {
  min: number;              // Minimum connections
  max: number;              // Maximum connections
  acquireTimeout?: number;  // Timeout for acquiring connection (ms)
  createTimeout?: number;   // Timeout for creating connection (ms)
  destroyTimeout?: number;  // Timeout for destroying connection (ms)
  idleTimeout?: number;     // Time before idle connection is destroyed (ms)
  reapInterval?: number;    // Interval to check for idle connections (ms)
  maxWaitingClients?: number; // Maximum queue size
  testOnBorrow?: boolean;   // Test connection before providing
  testOnReturn?: boolean;   // Test connection when returned
  evictionRunInterval?: number; // How often to run eviction checks
}

export interface PoolStats {
  size: number;           // Current pool size
  available: number;      // Available connections
  borrowed: number;       // Currently borrowed connections
  pending: number;        // Pending connection requests
  maxSize: number;        // Maximum pool size
  minSize: number;        // Minimum pool size
  totalCreated: number;   // Total connections created
  totalDestroyed: number; // Total connections destroyed
  totalBorrowed: number;  // Total successful borrows
  totalReturned: number;  // Total returns
  totalRejected: number;  // Total rejected requests
  averageWaitTime: number; // Average wait time for connection
}

export interface Connection<T> {
  id: string;
  resource: T;
  createdAt: Date;
  lastUsedAt: Date;
  borrowCount: number;
  inUse: boolean;
}

export abstract class ConnectionPool<T> extends EventEmitter {
  protected config: Required<PoolConfig>;
  protected connections: Map<string, Connection<T>>;
  protected availableConnections: Set<string>;
  protected waitingClients: Array<{
    resolve: (conn: T) => void;
    reject: (err: Error) => void;
    timeout: NodeJS.Timeout;
    startTime: number;
  }>;
  protected stats: PoolStats;
  protected reapTimer?: NodeJS.Timer;
  protected evictionTimer?: NodeJS.Timer;
  protected isShuttingDown: boolean = false;
  
  constructor(config: PoolConfig) {
    super();
    
    this.config = {
      min: config.min,
      max: config.max,
      acquireTimeout: config.acquireTimeout || 30000,
      createTimeout: config.createTimeout || 5000,
      destroyTimeout: config.destroyTimeout || 5000,
      idleTimeout: config.idleTimeout || 30000,
      reapInterval: config.reapInterval || 1000,
      maxWaitingClients: config.maxWaitingClients || 50,
      testOnBorrow: config.testOnBorrow !== false,
      testOnReturn: config.testOnReturn !== false,
      evictionRunInterval: config.evictionRunInterval || 10000,
    };
    
    this.connections = new Map();
    this.availableConnections = new Set();
    this.waitingClients = [];
    
    this.stats = {
      size: 0,
      available: 0,
      borrowed: 0,
      pending: 0,
      maxSize: this.config.max,
      minSize: this.config.min,
      totalCreated: 0,
      totalDestroyed: 0,
      totalBorrowed: 0,
      totalReturned: 0,
      totalRejected: 0,
      averageWaitTime: 0,
    };
  }
  
  /**
   * Initialize the pool
   */
  async initialize(): Promise<void> {
    logger.info({ config: this.config }, 'Initializing connection pool');
    
    // Create minimum connections
    const promises: Promise<void>[] = [];
    for (let i = 0; i < this.config.min; i++) {
      promises.push(this.createConnection());
    }
    
    await Promise.all(promises);
    
    // Start reaper for idle connections
    if (this.config.idleTimeout > 0) {
      this.reapTimer = setInterval(() => {
        this.reapIdleConnections();
      }, this.config.reapInterval);
    }
    
    // Start eviction timer
    if (this.config.evictionRunInterval > 0) {
      this.evictionTimer = setInterval(() => {
        this.evictConnections();
      }, this.config.evictionRunInterval);
    }
    
    this.emit('ready');
    logger.info({ size: this.connections.size }, 'Connection pool initialized');
  }
  
  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<T> {
    if (this.isShuttingDown) {
      throw new Error('Pool is shutting down');
    }
    
    const startTime = Date.now();
    
    // Try to get available connection
    const available = this.getAvailableConnection();
    if (available) {
      this.stats.totalBorrowed++;
      this.updateWaitTime(Date.now() - startTime);
      return available.resource;
    }
    
    // Create new connection if pool not full
    if (this.connections.size < this.config.max) {
      try {
        await this.createConnection();
        const newConn = this.getAvailableConnection();
        if (newConn) {
          this.stats.totalBorrowed++;
          this.updateWaitTime(Date.now() - startTime);
          return newConn.resource;
        }
      } catch (error) {
        logger.error({ error }, 'Failed to create new connection');
      }
    }
    
    // Wait for connection to become available
    if (this.waitingClients.length >= this.config.maxWaitingClients) {
      this.stats.totalRejected++;
      throw new Error('Maximum waiting clients exceeded');
    }
    
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingClients.findIndex(c => c.resolve === resolve);
        if (index !== -1) {
          this.waitingClients.splice(index, 1);
          this.stats.totalRejected++;
          reject(new Error('Acquire timeout'));
        }
      }, this.config.acquireTimeout);
      
      this.waitingClients.push({ resolve, reject, timeout, startTime });
      this.updateStats();
    });
  }
  
  /**
   * Release a connection back to the pool
   */
  async release(resource: T): Promise<void> {
    const connection = this.findConnectionByResource(resource);
    if (!connection) {
      logger.warn('Attempted to release unknown connection');
      return;
    }
    
    connection.inUse = false;
    connection.lastUsedAt = new Date();
    this.stats.totalReturned++;
    
    // Test connection if configured
    if (this.config.testOnReturn) {
      try {
        const isValid = await this.validateConnection(resource);
        if (!isValid) {
          await this.destroyConnection(connection.id);
          await this.createConnection(); // Replace with new connection
          return;
        }
      } catch (error) {
        logger.error({ error, connectionId: connection.id }, 'Error testing connection on return');
        await this.destroyConnection(connection.id);
        return;
      }
    }
    
    // Check for waiting clients
    if (this.waitingClients.length > 0) {
      const client = this.waitingClients.shift()!;
      clearTimeout(client.timeout);
      
      connection.inUse = true;
      connection.borrowCount++;
      
      this.updateWaitTime(Date.now() - client.startTime);
      client.resolve(resource);
    } else {
      this.availableConnections.add(connection.id);
    }
    
    this.updateStats();
    this.emit('release', resource);
  }
  
  /**
   * Destroy a connection
   */
  async destroy(resource: T): Promise<void> {
    const connection = this.findConnectionByResource(resource);
    if (connection) {
      await this.destroyConnection(connection.id);
    }
  }
  
  /**
   * Drain pool and destroy all connections
   */
  async drain(): Promise<void> {
    logger.info('Draining connection pool');
    this.isShuttingDown = true;
    
    // Clear timers
    if (this.reapTimer) {
      clearInterval(this.reapTimer);
    }
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
    }
    
    // Reject waiting clients
    for (const client of this.waitingClients) {
      clearTimeout(client.timeout);
      client.reject(new Error('Pool is draining'));
    }
    this.waitingClients = [];
    
    // Destroy all connections
    const destroyPromises: Promise<void>[] = [];
    for (const [id] of this.connections) {
      destroyPromises.push(this.destroyConnection(id));
    }
    
    await Promise.all(destroyPromises);
    
    this.emit('drain');
    logger.info('Connection pool drained');
  }
  
  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    this.updateStats();
    return { ...this.stats };
  }
  
  /**
   * Create a new connection
   */
  private async createConnection(): Promise<void> {
    const id = this.generateConnectionId();
    
    try {
      const resource = await this.withTimeout(
        this.createResource(),
        this.config.createTimeout,
        'Connection creation timeout'
      );
      
      const connection: Connection<T> = {
        id,
        resource,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        borrowCount: 0,
        inUse: false,
      };
      
      this.connections.set(id, connection);
      this.availableConnections.add(id);
      this.stats.totalCreated++;
      
      this.emit('create', resource);
      logger.debug({ connectionId: id }, 'Connection created');
    } catch (error) {
      logger.error({ error, connectionId: id }, 'Failed to create connection');
      throw error;
    }
  }
  
  /**
   * Destroy a connection
   */
  private async destroyConnection(id: string): Promise<void> {
    const connection = this.connections.get(id);
    if (!connection) return;
    
    try {
      await this.withTimeout(
        this.destroyResource(connection.resource),
        this.config.destroyTimeout,
        'Connection destruction timeout'
      );
      
      this.connections.delete(id);
      this.availableConnections.delete(id);
      this.stats.totalDestroyed++;
      
      this.emit('destroy', connection.resource);
      logger.debug({ connectionId: id }, 'Connection destroyed');
    } catch (error) {
      logger.error({ error, connectionId: id }, 'Error destroying connection');
    }
  }
  
  /**
   * Get an available connection
   */
  private getAvailableConnection(): Connection<T> | null {
    for (const id of this.availableConnections) {
      const connection = this.connections.get(id);
      if (connection && !connection.inUse) {
        this.availableConnections.delete(id);
        connection.inUse = true;
        connection.borrowCount++;
        connection.lastUsedAt = new Date();
        return connection;
      }
    }
    return null;
  }
  
  /**
   * Find connection by resource
   */
  private findConnectionByResource(resource: T): Connection<T> | undefined {
    for (const connection of this.connections.values()) {
      if (connection.resource === resource) {
        return connection;
      }
    }
    return undefined;
  }
  
  /**
   * Reap idle connections
   */
  private async reapIdleConnections(): Promise<void> {
    if (this.connections.size <= this.config.min) return;
    
    const now = Date.now();
    const toDestroy: string[] = [];
    
    for (const [id, connection] of this.connections) {
      if (!connection.inUse && 
          this.availableConnections.has(id) &&
          now - connection.lastUsedAt.getTime() > this.config.idleTimeout) {
        toDestroy.push(id);
      }
    }
    
    // Keep minimum connections
    const destroyCount = Math.min(
      toDestroy.length,
      this.connections.size - this.config.min
    );
    
    for (let i = 0; i < destroyCount; i++) {
      await this.destroyConnection(toDestroy[i]);
    }
    
    if (destroyCount > 0) {
      logger.debug({ count: destroyCount }, 'Reaped idle connections');
    }
  }
  
  /**
   * Evict connections based on strategy
   */
  private async evictConnections(): Promise<void> {
    // Override in subclasses for custom eviction strategies
    await this.reapIdleConnections();
  }
  
  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.size = this.connections.size;
    this.stats.available = this.availableConnections.size;
    this.stats.borrowed = this.stats.size - this.stats.available;
    this.stats.pending = this.waitingClients.length;
  }
  
  /**
   * Update average wait time
   */
  private updateWaitTime(waitTime: number): void {
    const total = this.stats.totalBorrowed + this.stats.totalRejected;
    this.stats.averageWaitTime = 
      (this.stats.averageWaitTime * (total - 1) + waitTime) / total;
  }
  
  /**
   * Execute with timeout
   */
  private async withTimeout<R>(
    promise: Promise<R>,
    timeout: number,
    message: string
  ): Promise<R> {
    return Promise.race([
      promise,
      new Promise<R>((_, reject) => 
        setTimeout(() => reject(new Error(message)), timeout)
      ),
    ]);
  }
  
  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Abstract methods to be implemented by subclasses
  
  protected abstract createResource(): Promise<T>;
  protected abstract destroyResource(resource: T): Promise<void>;
  protected abstract validateConnection(resource: T): Promise<boolean>;
}