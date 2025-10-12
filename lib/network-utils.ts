import React from 'react';

export class NetworkError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export const networkUtils = {
  /**
   * Check if the user is online
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  /**
   * Estimate connection speed based on Network Information API
   */
  getConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    if (typeof navigator === 'undefined') return 'fast';
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) return 'fast';
    
    const effectiveType = connection.effectiveType;
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'slow';
    } else if (effectiveType === '3g') {
      return 'medium';
    } else {
      return 'fast';
    }
  },

  /**
   * Retry a function with exponential backoff
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      delayMs?: number;
      backoffMultiplier?: number;
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      delayMs = 1000,
      backoffMultiplier = 2,
      onRetry,
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          const delay = delayMs * Math.pow(backoffMultiplier, attempt);
          
          if (onRetry) {
            onRetry(attempt + 1, lastError);
          }

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  },

  /**
   * Add timeout to a promise
   */
  withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new NetworkError('Request timeout', 'TIMEOUT')), timeoutMs)
      ),
    ]);
  },

  /**
   * Optimized fetch with retry and timeout for slow connections
   */
  async optimizedFetch(
    url: string,
    options: RequestInit = {},
    config: {
      timeout?: number;
      retries?: number;
      onRetry?: (attempt: number) => void;
    } = {}
  ): Promise<Response> {
    const {
      timeout = 30000, // 30 seconds default
      retries = 3,
      onRetry,
    } = config;

    const connectionSpeed = this.getConnectionSpeed();
    
    // Adjust timeout based on connection speed
    let adjustedTimeout = timeout;
    if (connectionSpeed === 'slow') {
      adjustedTimeout = timeout * 2;
    } else if (connectionSpeed === 'medium') {
      adjustedTimeout = timeout * 1.5;
    }

    return this.withRetry(
      async () => {
        if (!this.isOnline()) {
          throw new NetworkError('No internet connection', 'OFFLINE');
        }

        return this.withTimeout(fetch(url, options), adjustedTimeout);
      },
      {
        maxRetries: retries,
        delayMs: connectionSpeed === 'slow' ? 2000 : 1000,
        onRetry: (attempt, error) => {
          console.log(`Retry attempt ${attempt} for ${url}:`, error.message);
          if (onRetry) {
            onRetry(attempt);
          }
        },
      }
    );
  },

  /**
   * Check if error is a network error
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isNetworkError(error: any): boolean {
    return (
      error instanceof NetworkError ||
      error.name === 'NetworkError' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT' ||
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    );
  },

  /**
   * Get user-friendly error message
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getErrorMessage(error: any): string {
    if (error instanceof NetworkError) {
      if (error.code === 'OFFLINE') {
        return 'No internet connection. Please check your network and try again.';
      }
      if (error.code === 'TIMEOUT') {
        return 'Request timed out. Please try again.';
      }
    }

    if (this.isNetworkError(error)) {
      return 'Network error. Please check your connection and try again.';
    }

    return error.message || 'An unexpected error occurred';
  },

  /**
   * Debounce function for optimizing frequent requests
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debounce<T extends (...args: any[]) => any>(
    func: T,
    waitMs: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (this: any, ...args: Parameters<T>) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, waitMs);
    };
  },

  /**
   * Throttle function for rate limiting
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limitMs: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limitMs);
      }
    };
  },
};

/**
 * Hook for monitoring online/offline status
 */
export function useNetworkStatus() {
  // Early return with hooks called
  const [isOnline, setIsOnline] = React.useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [speed, setSpeed] = React.useState<'slow' | 'medium' | 'fast'>(
    typeof window !== 'undefined' ? networkUtils.getConnectionSpeed() : 'fast'
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Set initial values
    setIsOnline(navigator.onLine);
    setSpeed(networkUtils.getConnectionSpeed());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection speed periodically
    const speedInterval = setInterval(() => {
      setSpeed(networkUtils.getConnectionSpeed());
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(speedInterval);
    };
  }, []);

  return { isOnline, speed };
}

