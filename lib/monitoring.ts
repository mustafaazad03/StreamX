export interface WebVitalsMetric {
  name: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Report Web Vitals to analytics service
 */
export function reportWebVitals(metric: WebVitalsMetric): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
    });
  }

  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as unknown as {gtag?: unknown}).gtag) {
      (window as unknown as {gtag: (...args: unknown[]) => void}).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Example: Send to custom analytics endpoint
    try {
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
        keepalive: true,
      }).catch(() => {
        // Silently fail - don't impact user experience
      });
    } catch {
      // Silently fail
    }
  }
}

export class PerformanceMonitor {
  private static marks = new Map<string, number>();

  /**
   * Start measuring a performance metric
   */
  static start(label: string): void {
    if (typeof performance === 'undefined') return;
    
    this.marks.set(label, performance.now());
    
    if (performance.mark) {
      performance.mark(`${label}-start`);
    }
  }

  /**
   * End measuring and log the duration
   */
  static end(label: string, options?: { threshold?: number; context?: Record<string, unknown> }): number | null {
    if (typeof performance === 'undefined') return null;

    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`[Performance] No start mark found for: ${label}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);

    if (performance.mark && performance.measure) {
      performance.mark(`${label}-end`);
      try {
        performance.measure(label, `${label}-start`, `${label}-end`);
      } catch {
        // Measurement failed - continue silently
      }
    }

    // Log if duration exceeds threshold
    const threshold = options?.threshold || 1000; // Default 1s
    if (duration > threshold) {
      console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms`, options?.context);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`, options?.context);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.reportMetric(label, duration, options?.context);
    }

    return duration;
  }

  /**
   * Measure async operation
   */
  static async measure<T>(
    label: string,
    fn: () => Promise<T>,
    options?: { threshold?: number; context?: Record<string, unknown> }
  ): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label, options);
      return result;
    } catch (error) {
      this.end(label, { ...options, context: { ...options?.context, error: true } });
      throw error;
    }
  }

  /**
   * Report metric to analytics
   */
  private static reportMetric(name: string, value: number, context?: Record<string, unknown>): void {
    try {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value, context, timestamp: Date.now() }),
        keepalive: true,
      }).catch(() => {
        // Silently fail
      });
    } catch {
      // Silently fail
    }
  }

  /**
   * Get all performance entries
   */
  static getEntries(type?: string): PerformanceEntry[] {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return [];
    }

    if (type) {
      return performance.getEntriesByType(type);
    }

    return performance.getEntries();
  }

  /**
   * Clear all performance marks and measures
   */
  static clear(): void {
    this.marks.clear();
    
    if (typeof performance !== 'undefined') {
      if (performance.clearMarks) performance.clearMarks();
      if (performance.clearMeasures) performance.clearMeasures();
    }
  }
}

// ===== Resource Monitoring =====

export function logResourceTiming(): void {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  // Group resources by type
  const grouped: Record<string, PerformanceResourceTiming[]> = {};
  
  resources.forEach((resource) => {
    const type = resource.initiatorType || 'other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(resource);
  });

  // Log summary
  console.log('[Resource Timing Summary]');
  Object.entries(grouped).forEach(([type, items]) => {
    const totalSize = items.reduce((sum, item) => sum + (item.transferSize || 0), 0);
    const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);
    
    console.log(`  ${type}: ${items.length} resources, ${(totalSize / 1024).toFixed(2)}KB, ${totalDuration.toFixed(2)}ms`);
  });
}

// ===== Error Tracking =====

export interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  context?: Record<string, unknown>;
  timestamp: number;
  url: string;
  userAgent: string;
}

export function reportError(error: Error, context?: Record<string, unknown>): void {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Report]', report);
  }

  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    try {
      fetch('/api/analytics/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true,
      }).catch(() => {
        // Silently fail
      });
    } catch {
      // Silently fail
    }
  }
}

// ===== Network Monitoring =====

export function logNetworkInfo(): void {
  if (typeof navigator === 'undefined') return;

  const connection = (navigator as unknown as {connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  }}).connection;

  if (connection) {
    console.log('[Network Info]', {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    });
  }
}

// ===== Memory Monitoring =====

export function logMemoryUsage(): void {
  if (typeof performance === 'undefined') return;

  const memory = (performance as unknown as {memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }}).memory;

  if (memory) {
    console.log('[Memory Usage]', {
      used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    });
  }
}
