import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface PerformanceMetrics {
  fps: number
  memory?: {
    used: number
    limit: number
  }
  renderTime: number
  componentCount: number
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
    componentCount: 0,
  })

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measureFPS = () => {
      const currentTime = performance.now()
      frameCount++

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memory: getMemoryInfo(),
          componentCount: document.querySelectorAll('[data-testid]').length,
        }))

        frameCount = 0
        lastTime = currentTime
      }

      animationId = requestAnimationFrame(measureFPS)
    }

    animationId = requestAnimationFrame(measureFPS)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  const getMemoryInfo = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      }
    }
    return undefined
  }, [])

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-500'
    if (fps >= 30) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getMemoryColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100
    if (percentage < 50) return 'text-green-500'
    if (percentage < 80) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-background border rounded-md p-2 shadow-lg hover:bg-accent transition-colors"
        aria-label="Toggle performance monitor"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 min-w-[200px] font-mono text-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Performance</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-accent rounded"
              aria-label="Close performance monitor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {/* FPS */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">FPS:</span>
              <span className={cn('font-bold', getFPSColor(metrics.fps))}>
                {metrics.fps}
              </span>
            </div>

            {/* Memory */}
            {metrics.memory && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Memory:</span>
                <span 
                  className={cn(
                    'font-bold',
                    getMemoryColor(metrics.memory.used, metrics.memory.limit)
                  )}
                >
                  {metrics.memory.used}MB
                </span>
              </div>
            )}

            {/* Component Count */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Components:</span>
              <span className="font-bold">{metrics.componentCount}</span>
            </div>

            {/* Render Time */}
            {metrics.renderTime > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Render:</span>
                <span className="font-bold">{metrics.renderTime.toFixed(2)}ms</span>
              </div>
            )}
          </div>

          {/* Performance Tips */}
          {metrics.fps < 30 && (
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              ⚠️ Low FPS detected. Check for:
              <ul className="mt-1 ml-4 list-disc">
                <li>Heavy computations</li>
                <li>Excessive re-renders</li>
                <li>Large DOM trees</li>
              </ul>
            </div>
          )}

          {metrics.memory && metrics.memory.used > metrics.memory.limit * 0.8 && (
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              ⚠️ High memory usage. Consider:
              <ul className="mt-1 ml-4 list-disc">
                <li>Cleaning up event listeners</li>
                <li>Unmounting unused components</li>
                <li>Optimizing data structures</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  )
}