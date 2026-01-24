/**
 * Performance monitoring utilities for production
 */

// Performance metrics collection
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  /**
   * Measure the execution time of an async function
   */
  static async measure<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordMetric(name, duration)
      
      // Log slow operations in development
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(`${name}_error`, duration)
      throw error
    }
  }

  /**
   * Record a metric value
   */
  private static recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  /**
   * Get statistics for a metric
   */
  static getStats(name: string) {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) {
      return null
    }

    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }

  /**
   * Get all metrics
   */
  static getAllStats() {
    const stats: Record<string, any> = {}
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name)
    }
    return stats
  }

  /**
   * Clear all metrics
   */
  static clear() {
    this.metrics.clear()
  }
}

/**
 * Mark a performance point for Web Vitals
 */
export function markPerformance(name: string) {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(name)
  }
}

/**
 * Measure between two performance marks
 */
export function measurePerformance(name: string, startMark: string, endMark: string) {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name)[0]
      return measure.duration
    } catch (error) {
      console.error('Performance measurement failed:', error)
      return null
    }
  }
  return null
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: any) {
  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to analytics
    // analytics.track('web-vital', {
    //   name: metric.name,
    //   value: metric.value,
    //   id: metric.id,
    // })
  }
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', metric.name, metric.value)
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Lazy load a component (Note: Use React.lazy directly in components)
 * This is a helper for documentation purposes
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return React.lazy(importFunc)
}

// Import React for lazy loading
import React from 'react'
