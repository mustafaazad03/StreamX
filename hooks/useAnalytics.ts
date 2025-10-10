'use client';

import { useState, useEffect } from 'react';
import { analyticsService } from '@/lib/services/analytics.service';
import { PollAnalytics } from '@/lib/types';

export function usePollAnalytics(pollId: string) {
  const [analytics, setAnalytics] = useState<PollAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [pollId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getPollAnalytics(pollId);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  return { analytics, loading, error, refetch: fetchAnalytics };
}

export function useUserStatistics(userId: string) {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchStatistics();
    }
  }, [userId]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getUserStatistics(userId);
      setStatistics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  return { statistics, loading, error, refetch: fetchStatistics };
}

export function useEngagementMetrics(pollId: string) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [pollId]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getEngagementMetrics(pollId);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  return { metrics, loading, error, refetch: fetchMetrics };
}
