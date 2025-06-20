import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import * as os from 'os';
import * as process from 'process';

export interface PerformanceMetrics {
  timestamp: Date;
  cpu: {
    usage: number;        // Percentage
    loadAverage: number[];
    count: number;
  };
  memory: {
    used: number;         // Bytes
    total: number;        // Bytes
    percentage: number;   // Percentage
    heap: {
      used: number;
      total: number;
      limit: number;
    };
  };
  requests: {
    active: number;
    total: number;
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    errorRate: number;
  };
  models: {
    loaded: number;
    totalMemory: number;
    requests: Map<string, ModelMetrics>;
  };
  throughput: {
    requestsPerSecond: number;
    tokensPerSecond: number;
    bytesPerSecond: number;
  };
}

export interface ModelMetrics {
  modelId: string;
  provider: string;
  requests: number;
  errors: number;
  totalTokens: number;
  averageLatency: number;
  memoryUsage: number;
}

export interface PerformanceAlert {
  level: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
}

export interface MonitorConfig {
  interval?: number;              // Monitoring interval in ms
  historySize?: number;          // Number of historical data points
  alertThresholds?: {
    cpuUsage?: number;
    memoryUsage?: number;
    errorRate?: number;
    latencyP95?: number;
    latencyP99?: number;
  };
  enableAlerts?: boolean;
}

export class PerformanceMonitor extends EventEmitter {
  private config: Required<MonitorConfig>;
  private metrics: PerformanceMetrics[] = [];
  private requests: Map<string, RequestMetrics> = new Map();
  private modelMetrics: Map<string, ModelMetrics> = new Map();
  private monitorInterval?: NodeJS.Timer;
  private startTime: Date;
  private totalRequests: number = 0;
  private totalErrors: number = 0;
  private latencies: number[] = [];
  
  constructor(config?: MonitorConfig) {
    super();
    
    this.config = {
      interval: config?.interval || 10000, // 10 seconds
      historySize: config?.historySize || 360, // 1 hour at 10s intervals
      alertThresholds: {
        cpuUsage: config?.alertThresholds?.cpuUsage || 80,
        memoryUsage: config?.alertThresholds?.memoryUsage || 85,
        errorRate: config?.alertThresholds?.errorRate || 5,
        latencyP95: config?.alertThresholds?.latencyP95 || 5000,
        latencyP99: config?.alertThresholds?.latencyP99 || 10000,
      },
      enableAlerts: config?.enableAlerts !== false,
    };
    
    this.startTime = new Date();
  }
  
  /**
   * Start monitoring
   */
  start(): void {
    if (this.monitorInterval) {
      return;
    }
    
    logger.info('Starting performance monitoring');
    
    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.interval);
    
    // Collect initial metrics
    this.collectMetrics();
  }
  
  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
      logger.info('Stopped performance monitoring');
    }
  }
  
  /**
   * Record request start
   */
  recordRequestStart(requestId: string, metadata?: any): void {
    this.requests.set(requestId, {
      startTime: Date.now(),
      metadata,
    });
  }
  
  /**
   * Record request end
   */
  recordRequestEnd(
    requestId: string,
    success: boolean,
    metadata?: {
      modelId?: string;
      provider?: string;
      tokens?: number;
      bytes?: number;
    }
  ): void {
    const request = this.requests.get(requestId);
    if (!request) return;
    
    const latency = Date.now() - request.startTime;
    this.latencies.push(latency);
    
    // Keep only recent latencies (last 1000)
    if (this.latencies.length > 1000) {
      this.latencies.shift();
    }
    
    this.totalRequests++;
    if (!success) {
      this.totalErrors++;
    }
    
    // Update model metrics
    if (metadata?.modelId && metadata?.provider) {
      const key = `${metadata.provider}:${metadata.modelId}`;
      const modelMetric = this.modelMetrics.get(key) || {
        modelId: metadata.modelId,
        provider: metadata.provider,
        requests: 0,
        errors: 0,
        totalTokens: 0,
        averageLatency: 0,
        memoryUsage: 0,
      };
      
      modelMetric.requests++;
      if (!success) modelMetric.errors++;
      if (metadata.tokens) modelMetric.totalTokens += metadata.tokens;
      
      // Update average latency
      modelMetric.averageLatency = 
        (modelMetric.averageLatency * (modelMetric.requests - 1) + latency) / 
        modelMetric.requests;
      
      this.modelMetrics.set(key, modelMetric);
    }
    
    this.requests.delete(requestId);
  }
  
  /**
   * Update model memory usage
   */
  updateModelMemory(provider: string, modelId: string, memoryUsage: number): void {
    const key = `${provider}:${modelId}`;
    const metric = this.modelMetrics.get(key);
    
    if (metric) {
      metric.memoryUsage = memoryUsage;
    }
  }
  
  /**
   * Get current metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }
  
  /**
   * Get historical metrics
   */
  getHistoricalMetrics(duration?: number): PerformanceMetrics[] {
    if (!duration) {
      return [...this.metrics];
    }
    
    const cutoff = Date.now() - duration;
    return this.metrics.filter(m => m.timestamp.getTime() > cutoff);
  }
  
  /**
   * Get model-specific metrics
   */
  getModelMetrics(): ModelMetrics[] {
    return Array.from(this.modelMetrics.values());
  }
  
  /**
   * Collect system metrics
   */
  private collectMetrics(): void {
    const now = new Date();
    const cpuUsage = this.getCPUUsage();
    const memoryInfo = this.getMemoryInfo();
    const requestMetrics = this.getRequestMetrics();
    const throughput = this.getThroughputMetrics();
    
    const metrics: PerformanceMetrics = {
      timestamp: now,
      cpu: {
        usage: cpuUsage,
        loadAverage: os.loadavg(),
        count: os.cpus().length,
      },
      memory: memoryInfo,
      requests: requestMetrics,
      models: {
        loaded: this.modelMetrics.size,
        totalMemory: Array.from(this.modelMetrics.values())
          .reduce((sum, m) => sum + m.memoryUsage, 0),
        requests: new Map(this.modelMetrics),
      },
      throughput,
    };
    
    this.metrics.push(metrics);
    
    // Maintain history size
    if (this.metrics.length > this.config.historySize) {
      this.metrics.shift();
    }
    
    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkAlerts(metrics);
    }
    
    this.emit('metrics', metrics);
    
    logger.debug({
      cpu: `${cpuUsage.toFixed(1)}%`,
      memory: `${memoryInfo.percentage.toFixed(1)}%`,
      activeRequests: requestMetrics.active,
      rps: throughput.requestsPerSecond.toFixed(2),
    }, 'Performance metrics collected');
  }
  
  /**
   * Get CPU usage percentage
   */
  private getCPUUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    return usage;
  }
  
  /**
   * Get memory information
   */
  private getMemoryInfo(): PerformanceMetrics['memory'] {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memUsage = process.memoryUsage();
    
    return {
      used: usedMemory,
      total: totalMemory,
      percentage: (usedMemory / totalMemory) * 100,
      heap: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        limit: memUsage.rss,
      },
    };
  }
  
  /**
   * Get request metrics
   */
  private getRequestMetrics(): PerformanceMetrics['requests'] {
    const errorRate = this.totalRequests > 0 
      ? (this.totalErrors / this.totalRequests) * 100 
      : 0;
    
    const sortedLatencies = [...this.latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedLatencies.length * 0.95);
    const p99Index = Math.floor(sortedLatencies.length * 0.99);
    
    return {
      active: this.requests.size,
      total: this.totalRequests,
      averageLatency: this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length || 0,
      p95Latency: sortedLatencies[p95Index] || 0,
      p99Latency: sortedLatencies[p99Index] || 0,
      errorRate,
    };
  }
  
  /**
   * Get throughput metrics
   */
  private getThroughputMetrics(): PerformanceMetrics['throughput'] {
    const uptime = (Date.now() - this.startTime.getTime()) / 1000; // seconds
    
    // Calculate from recent history (last minute)
    const recentMetrics = this.getHistoricalMetrics(60000);
    let recentRequests = 0;
    let recentTokens = 0;
    
    if (recentMetrics.length > 0) {
      const firstMetric = recentMetrics[0];
      const lastMetric = recentMetrics[recentMetrics.length - 1];
      recentRequests = lastMetric.requests.total - firstMetric.requests.total;
      
      // Sum tokens from model metrics
      for (const [key, metric] of lastMetric.models.requests) {
        const firstModelMetric = firstMetric.models.requests.get(key);
        if (firstModelMetric) {
          recentTokens += metric.totalTokens - firstModelMetric.totalTokens;
        }
      }
    }
    
    const recentDuration = Math.min(60, uptime); // seconds
    
    return {
      requestsPerSecond: recentRequests / recentDuration,
      tokensPerSecond: recentTokens / recentDuration,
      bytesPerSecond: 0, // Would need to track bytes
    };
  }
  
  /**
   * Check for performance alerts
   */
  private checkAlerts(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];
    
    // CPU usage alert
    if (metrics.cpu.usage > this.config.alertThresholds.cpuUsage) {
      alerts.push({
        level: metrics.cpu.usage > 90 ? 'critical' : 'warning',
        metric: 'cpu_usage',
        value: metrics.cpu.usage,
        threshold: this.config.alertThresholds.cpuUsage,
        message: `CPU usage is ${metrics.cpu.usage.toFixed(1)}%`,
        timestamp: new Date(),
      });
    }
    
    // Memory usage alert
    if (metrics.memory.percentage > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        level: metrics.memory.percentage > 95 ? 'critical' : 'warning',
        metric: 'memory_usage',
        value: metrics.memory.percentage,
        threshold: this.config.alertThresholds.memoryUsage,
        message: `Memory usage is ${metrics.memory.percentage.toFixed(1)}%`,
        timestamp: new Date(),
      });
    }
    
    // Error rate alert
    if (metrics.requests.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        level: 'warning',
        metric: 'error_rate',
        value: metrics.requests.errorRate,
        threshold: this.config.alertThresholds.errorRate,
        message: `Error rate is ${metrics.requests.errorRate.toFixed(1)}%`,
        timestamp: new Date(),
      });
    }
    
    // Latency alerts
    if (metrics.requests.p95Latency > this.config.alertThresholds.latencyP95) {
      alerts.push({
        level: 'warning',
        metric: 'latency_p95',
        value: metrics.requests.p95Latency,
        threshold: this.config.alertThresholds.latencyP95,
        message: `P95 latency is ${metrics.requests.p95Latency}ms`,
        timestamp: new Date(),
      });
    }
    
    // Emit alerts
    for (const alert of alerts) {
      this.emit('alert', alert);
      logger.warn(alert, 'Performance alert');
    }
  }
}

interface RequestMetrics {
  startTime: number;
  metadata?: any;
}