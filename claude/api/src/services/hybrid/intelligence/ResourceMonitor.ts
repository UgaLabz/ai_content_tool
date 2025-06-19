import { logger } from '../../../utils/logger';
import * as os from 'os';

export interface SystemResources {
  cpu: {
    usage: number; // percentage
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number; // bytes
    used: number;
    free: number;
    usage: number; // percentage
  };
  gpu?: {
    available: boolean;
    usage?: number; // percentage
    memory?: {
      total: number;
      used: number;
      free: number;
    };
  };
}

export interface ResourceThresholds {
  maxCpuUsage: number; // percentage
  maxMemoryUsage: number; // percentage
  minFreeMemory: number; // bytes
  maxGpuUsage?: number; // percentage
}

export interface ResourceAlert {
  level: 'warning' | 'critical';
  resource: 'cpu' | 'memory' | 'gpu';
  message: string;
  currentValue: number;
  threshold: number;
}

export class ResourceMonitor {
  private monitoringInterval: NodeJS.Timer | null = null;
  private resourceHistory: SystemResources[] = [];
  private readonly maxHistorySize = 100;
  private alerts: ResourceAlert[] = [];
  
  private thresholds: ResourceThresholds = {
    maxCpuUsage: 80,
    maxMemoryUsage: 85,
    minFreeMemory: 1024 * 1024 * 1024, // 1GB
    maxGpuUsage: 90,
  };
  
  startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }
    
    this.monitoringInterval = setInterval(() => {
      const resources = this.getCurrentResources();
      this.recordResources(resources);
      this.checkThresholds(resources);
    }, intervalMs);
    
    logger.info({ interval: intervalMs }, 'Resource monitoring started');
  }
  
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Resource monitoring stopped');
    }
  }
  
  getCurrentResources(): SystemResources {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // Calculate CPU usage
    const cpuUsage = this.calculateCpuUsage(cpus);
    
    const resources: SystemResources = {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        loadAverage: os.loadavg(),
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usage: (usedMemory / totalMemory) * 100,
      },
    };
    
    // Try to get GPU info (this is platform-specific)
    const gpuInfo = this.getGpuInfo();
    if (gpuInfo) {
      resources.gpu = gpuInfo;
    }
    
    return resources;
  }
  
  canHandleLoad(estimatedMemoryMB: number, estimatedCpuPercent: number): boolean {
    const current = this.getCurrentResources();
    
    // Check memory
    const requiredMemory = estimatedMemoryMB * 1024 * 1024;
    if (current.memory.free < requiredMemory + this.thresholds.minFreeMemory) {
      logger.warn({
        required: requiredMemory,
        available: current.memory.free,
      }, 'Insufficient memory for load');
      return false;
    }
    
    // Check CPU
    if (current.cpu.usage + estimatedCpuPercent > this.thresholds.maxCpuUsage) {
      logger.warn({
        currentCpu: current.cpu.usage,
        additional: estimatedCpuPercent,
        threshold: this.thresholds.maxCpuUsage,
      }, 'CPU usage would exceed threshold');
      return false;
    }
    
    return true;
  }
  
  getResourceAvailability(): {
    cpu: number; // available percentage
    memory: number; // available MB
    gpu?: number; // available percentage
  } {
    const current = this.getCurrentResources();
    
    return {
      cpu: Math.max(0, 100 - current.cpu.usage),
      memory: current.memory.free / (1024 * 1024),
      gpu: current.gpu ? Math.max(0, 100 - (current.gpu.usage || 0)) : undefined,
    };
  }
  
  getRecommendedProviderType(): 'local' | 'cloud' | 'any' {
    const current = this.getCurrentResources();
    const availability = this.getResourceAvailability();
    
    // If resources are critically low, prefer cloud
    if (current.memory.usage > 90 || current.cpu.usage > 90) {
      return 'cloud';
    }
    
    // If resources are abundant, prefer local
    if (availability.memory > 8192 && availability.cpu > 50) {
      return 'local';
    }
    
    // Otherwise, any is fine
    return 'any';
  }
  
  getAlerts(): ResourceAlert[] {
    return [...this.alerts];
  }
  
  clearAlerts(): void {
    this.alerts = [];
  }
  
  private recordResources(resources: SystemResources): void {
    this.resourceHistory.push(resources);
    
    if (this.resourceHistory.length > this.maxHistorySize) {
      this.resourceHistory.shift();
    }
  }
  
  private checkThresholds(resources: SystemResources): void {
    this.alerts = [];
    
    // CPU checks
    if (resources.cpu.usage > this.thresholds.maxCpuUsage) {
      this.alerts.push({
        level: resources.cpu.usage > 95 ? 'critical' : 'warning',
        resource: 'cpu',
        message: `CPU usage is at ${resources.cpu.usage.toFixed(1)}%`,
        currentValue: resources.cpu.usage,
        threshold: this.thresholds.maxCpuUsage,
      });
    }
    
    // Memory checks
    if (resources.memory.usage > this.thresholds.maxMemoryUsage) {
      this.alerts.push({
        level: resources.memory.usage > 95 ? 'critical' : 'warning',
        resource: 'memory',
        message: `Memory usage is at ${resources.memory.usage.toFixed(1)}%`,
        currentValue: resources.memory.usage,
        threshold: this.thresholds.maxMemoryUsage,
      });
    }
    
    if (resources.memory.free < this.thresholds.minFreeMemory) {
      this.alerts.push({
        level: 'critical',
        resource: 'memory',
        message: `Only ${(resources.memory.free / (1024 * 1024)).toFixed(0)}MB free memory remaining`,
        currentValue: resources.memory.free,
        threshold: this.thresholds.minFreeMemory,
      });
    }
    
    // GPU checks
    if (resources.gpu && resources.gpu.usage && this.thresholds.maxGpuUsage) {
      if (resources.gpu.usage > this.thresholds.maxGpuUsage) {
        this.alerts.push({
          level: resources.gpu.usage > 95 ? 'critical' : 'warning',
          resource: 'gpu',
          message: `GPU usage is at ${resources.gpu.usage.toFixed(1)}%`,
          currentValue: resources.gpu.usage,
          threshold: this.thresholds.maxGpuUsage,
        });
      }
    }
    
    // Log alerts
    for (const alert of this.alerts) {
      if (alert.level === 'critical') {
        logger.error({ alert }, 'Critical resource alert');
      } else {
        logger.warn({ alert }, 'Resource warning');
      }
    }
  }
  
  private calculateCpuUsage(cpus: os.CpuInfo[]): number {
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof os.CpuTimes];
      }
      totalIdle += cpu.times.idle;
    }
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    return Math.max(0, Math.min(100, usage));
  }
  
  private getGpuInfo(): SystemResources['gpu'] | undefined {
    // This is a placeholder for GPU monitoring
    // In a real implementation, you would use nvidia-smi, rocm-smi, or similar tools
    // For now, we'll return undefined or mock data
    
    // Check if NVIDIA GPU is likely available
    const platform = os.platform();
    if (platform === 'linux' || platform === 'win32') {
      // In production, you would execute nvidia-smi here
      // For now, return that GPU is available but no usage data
      return {
        available: true,
        usage: undefined,
        memory: undefined,
      };
    }
    
    return undefined;
  }
  
  getResourceHistory(): SystemResources[] {
    return [...this.resourceHistory];
  }
  
  getAverageResources(periodMs: number = 60000): SystemResources | null {
    const cutoff = Date.now() - periodMs;
    const recentHistory = this.resourceHistory.slice(-20); // Last 20 samples
    
    if (recentHistory.length === 0) {
      return null;
    }
    
    const avgCpu = recentHistory.reduce((sum, r) => sum + r.cpu.usage, 0) / recentHistory.length;
    const avgMemUsage = recentHistory.reduce((sum, r) => sum + r.memory.usage, 0) / recentHistory.length;
    
    const latest = recentHistory[recentHistory.length - 1];
    
    return {
      cpu: {
        usage: avgCpu,
        cores: latest.cpu.cores,
        loadAverage: latest.cpu.loadAverage,
      },
      memory: {
        total: latest.memory.total,
        used: (latest.memory.total * avgMemUsage) / 100,
        free: latest.memory.total - (latest.memory.total * avgMemUsage) / 100,
        usage: avgMemUsage,
      },
      gpu: latest.gpu,
    };
  }
}