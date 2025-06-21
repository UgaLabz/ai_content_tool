import { useEffect, useRef, useCallback } from 'react'
import { PerformanceMonitor } from '@/tests/utils/performance'

export interface UsePerformanceMonitorOptions {
  componentName: string
  logToConsole?: boolean
  warnOnSlowRender?: boolean
  slowRenderThreshold?: number
}

export function usePerformanceMonitor({
  componentName,
  logToConsole = false,
  warnOnSlowRender = true,
  slowRenderThreshold = 100,
}: UsePerformanceMonitorOptions) {
  const monitor = useRef(new PerformanceMonitor())
  const renderCount = useRef(0)
  const mountTime = useRef<number>(0)

  useEffect(() => {
    // Record mount time
    mountTime.current = performance.now()
    renderCount.current++

    if (logToConsole) {
      console.log(`[Performance] ${componentName} mounted`)
    }

    return () => {
      const totalLifetime = performance.now() - mountTime.current
      
      if (logToConsole) {
        console.log(`[Performance] ${componentName} unmounted after ${totalLifetime.toFixed(2)}ms`)
        console.log(`Total renders: ${renderCount.current}`)
        
        const avgRenderTime = monitor.current.getAverageRenderTime()
        if (avgRenderTime > 0) {
          console.log(`Average render time: ${avgRenderTime.toFixed(2)}ms`)
        }
      }
    }
  }, [componentName, logToConsole])

  useEffect(() => {
    // Track re-renders
    if (renderCount.current > 1) {
      const renderTime = performance.now() - mountTime.current
      
      monitor.current.recordMetric({
        componentName,
        renderTime,
        reRenderTime: renderTime,
        timestamp: Date.now(),
      })

      if (warnOnSlowRender && renderTime > slowRenderThreshold) {
        console.warn(
          `[Performance Warning] ${componentName} slow render: ${renderTime.toFixed(2)}ms`
        )
      }

      if (logToConsole) {
        console.log(`[Performance] ${componentName} re-rendered in ${renderTime.toFixed(2)}ms`)
      }
    }
    
    renderCount.current++
  })

  const measureOperation = useCallback(
    async <T,>(operation: () => Promise<T>, operationName: string): Promise<T> => {
      const startTime = performance.now()
      
      try {
        const result = await operation()
        const duration = performance.now() - startTime
        
        if (logToConsole) {
          console.log(
            `[Performance] ${componentName} - ${operationName}: ${duration.toFixed(2)}ms`
          )
        }
        
        if (warnOnSlowRender && duration > slowRenderThreshold) {
          console.warn(
            `[Performance Warning] ${componentName} - ${operationName} slow: ${duration.toFixed(2)}ms`
          )
        }
        
        return result
      } catch (error) {
        const duration = performance.now() - startTime
        console.error(
          `[Performance] ${componentName} - ${operationName} failed after ${duration.toFixed(2)}ms`
        )
        throw error
      }
    },
    [componentName, logToConsole, warnOnSlowRender, slowRenderThreshold]
  )

  const getMetrics = useCallback(() => {
    return {
      renderCount: renderCount.current,
      metrics: monitor.current.getMetrics(),
      averageRenderTime: monitor.current.getAverageRenderTime(),
      memoryUsage: monitor.current.getMemoryUsage(),
    }
  }, [])

  return {
    measureOperation,
    getMetrics,
    monitor: monitor.current,
  }
}