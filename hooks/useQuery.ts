import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseQueryOptions<T> {
  enabled?: boolean;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number | boolean;
  retryDelay?: number;
  cacheTime?: number;
  staleTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseQueryResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  isStale: boolean;
  refetch: () => Promise<void>;
  mutate: (data: T) => void;
}

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleAt: number;
}

const queryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Advanced data fetching hook with caching and optimistic updates
 */
export function useQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const {
    enabled = true,
    refetchInterval,
    refetchOnWindowFocus = true,
    retry = 3,
    retryDelay = 1000,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 0,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isStale, setIsStale] = useState<boolean>(false);

  const retryCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get cached data
  const getCachedData = useCallback((): T | null => {
    const cached = queryCache.get(queryKey) as CacheEntry<T> | undefined;
    if (!cached) return null;

    const now = Date.now();
    
    // Check if cache is expired
    if (now - cached.timestamp > cacheTime) {
      queryCache.delete(queryKey);
      return null;
    }

    // Check if data is stale
    if (now > cached.staleAt) {
      setIsStale(true);
    }

    return cached.data;
  }, [queryKey, cacheTime]);

  // Set cache
  const setCachedData = useCallback((newData: T) => {
    const now = Date.now();
    queryCache.set(queryKey, {
      data: newData,
      timestamp: now,
      staleAt: now + staleTime,
    });
  }, [queryKey, staleTime]);

  // Fetch data with retry logic
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await queryFn();
      
      if (!isMountedRef.current) return;

      setData(result);
      setCachedData(result);
      setIsStale(false);
      retryCountRef.current = 0;

      onSuccess?.(result);
    } catch (err) {
      if (!isMountedRef.current) return;

      const error = err instanceof Error ? err : new Error('An error occurred');
      
      // Retry logic
      const maxRetries = typeof retry === 'number' ? retry : (retry ? 3 : 0);
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData();
        }, retryDelay * retryCountRef.current);
      } else {
        setError(error);
        onError?.(error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [queryFn, retry, retryDelay, setCachedData, onSuccess, onError]);

  // Refetch function
  const refetch = useCallback(async () => {
    retryCountRef.current = 0;
    await fetchData();
  }, [fetchData]);

  // Optimistic update
  const mutate = useCallback((newData: T) => {
    setData(newData);
    setCachedData(newData);
  }, [setCachedData]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;

    // Check cache first
    const cached = getCachedData();
    if (cached) {
      setData(cached);
      setLoading(false);
      
      // If data is stale, fetch in background
      if (isStale) {
        fetchData();
      }
    } else {
      fetchData();
    }
  }, [enabled, queryKey, getCachedData, fetchData, isStale]);

  // Refetch interval
  useEffect(() => {
    if (!enabled || !refetchInterval) return;

    intervalRef.current = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, refetchInterval, fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!enabled || !refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (isStale) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, refetchOnWindowFocus, isStale, fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    error,
    loading,
    isStale,
    refetch,
    mutate,
  };
}

/**
 * Clear all query cache
 */
export function clearQueryCache(): void {
  queryCache.clear();
}

/**
 * Clear specific query from cache
 */
export function clearQuery(queryKey: string): void {
  queryCache.delete(queryKey);
}

/**
 * Prefetch query data
 */
export async function prefetchQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  staleTime = 0
): Promise<void> {
  try {
    const data = await queryFn();
    const now = Date.now();
    
    queryCache.set(queryKey, {
      data,
      timestamp: now,
      staleAt: now + staleTime,
    });
  } catch (error) {
    console.error('Prefetch failed:', error);
  }
}
