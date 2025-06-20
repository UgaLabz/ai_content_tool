import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals'

export interface WebVitalsMetrics {
  CLS?: number  // Cumulative Layout Shift
  FCP?: number  // First Contentful Paint
  LCP?: number  // Largest Contentful Paint
  TTFB?: number // Time to First Byte
  INP?: number  // Interaction to Next Paint
}

// Performance thresholds based on Web Vitals recommendations
export const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
}

export type MetricRating = 'good' | 'needs-improvement' | 'poor'

export function getRating(metricName: keyof WebVitalsMetrics, value: number): MetricRating {
  const thresholds = WEB_VITALS_THRESHOLDS[metricName]
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.needsImprovement) return 'needs-improvement'
  return 'poor'
}

export function initWebVitals(onReport?: (metric: Metric) => void) {
  const reportHandler = (metric: Metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const rating = getRating(metric.name as keyof WebVitalsMetrics, metric.value)
      const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌'
      
      console.log(
        `${emoji} [Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}${
          metric.name === 'CLS' ? '' : 'ms'
        } (${rating})`
      )
    }

    // Call custom handler if provided
    if (onReport) {
      onReport(metric)
    }

    // Send to analytics (if configured)
    sendToAnalytics(metric)
  }

  // Register all Web Vitals
  onCLS(reportHandler)
  onFCP(reportHandler)
  onLCP(reportHandler)
  onTTFB(reportHandler)
  onINP(reportHandler)
}

function sendToAnalytics(metric: Metric) {
  // Example: Send to Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: getRating(metric.name as keyof WebVitalsMetrics, metric.value),
    })
  }
}

// Utility to get all current metrics
export function getAllMetrics(): Promise<WebVitalsMetrics> {
  return new Promise((resolve) => {
    const metrics: WebVitalsMetrics = {}
    let metricsCount = 0
    const totalMetrics = 5

    const checkComplete = () => {
      metricsCount++
      if (metricsCount === totalMetrics) {
        resolve(metrics)
      }
    }

    onCLS((metric) => {
      metrics.CLS = metric.value
      checkComplete()
    })

    onFCP((metric) => {
      metrics.FCP = metric.value
      checkComplete()
    })

    onLCP((metric) => {
      metrics.LCP = metric.value
      checkComplete()
    })

    onTTFB((metric) => {
      metrics.TTFB = metric.value
      checkComplete()
    })

    onINP((metric) => {
      metrics.INP = metric.value
      checkComplete()
    })

    // Timeout after 10 seconds
    setTimeout(() => {
      resolve(metrics)
    }, 10000)
  })
}