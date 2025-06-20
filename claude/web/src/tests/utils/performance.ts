import { performance } from 'perf_hooks'

export interface PerformanceMetrics {
  renderTime: number
  reRenderTime: number
  componentName: string
  timestamp: number
}

export interface MemoryMetrics {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private marks: Map<string, number> = new Map()

  startMeasure(name: string) {
    this.marks.set(name, performance.now())
  }

  endMeasure(name: string): number {
    const startTime = this.marks.get(name)
    if (!startTime) {
      throw new Error(`No start mark found for ${name}`)
    }
    
    const endTime = performance.now()
    const duration = endTime - startTime
    this.marks.delete(name)
    
    return duration
  }

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric)
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  clearMetrics() {
    this.metrics = []
    this.marks.clear()
  }

  getAverageRenderTime(componentName?: string): number {
    const relevantMetrics = componentName
      ? this.metrics.filter(m => m.componentName === componentName)
      : this.metrics

    if (relevantMetrics.length === 0) return 0

    const sum = relevantMetrics.reduce((acc, m) => acc + m.renderTime, 0)
    return sum / relevantMetrics.length
  }

  getMemoryUsage(): MemoryMetrics | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      }
    }
    return null
  }
}

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  FAST_RENDER: 16, // 60fps
  ACCEPTABLE_RENDER: 100,
  SLOW_RENDER: 1000,
  
  FAST_INTERACTION: 100,
  ACCEPTABLE_INTERACTION: 300,
  SLOW_INTERACTION: 1000,
  
  // Memory thresholds (in MB)
  MAX_HEAP_SIZE: 50 * 1024 * 1024, // 50MB
  WARNING_HEAP_SIZE: 30 * 1024 * 1024, // 30MB
}

// React Performance Profiler wrapper
export interface ProfilerData {
  id: string
  phase: 'mount' | 'update'
  actualDuration: number
  baseDuration: number
  startTime: number
  commitTime: number
}

export const onRenderCallback = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
): ProfilerData => {
  return {
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  }
}

// Utility to measure async operations
export async function measureAsyncOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now()
  const result = await operation()
  const duration = performance.now() - startTime
  
  return { result, duration }
}

// Utility to simulate heavy computation
export function simulateHeavyComputation(iterations = 1000000) {
  let result = 0
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i)
  }
  return result
}