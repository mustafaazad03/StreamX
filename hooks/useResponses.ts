'use client';

import { useState, useEffect } from 'react';
import { responseService } from '@/lib/services/response.service';
import { Response, SubmitResponseData } from '@/lib/types';
import { useRealtime } from '@/contexts/RealtimeContext';

export function useResponses(pollId: string) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscribeToResponses } = useRealtime();

  useEffect(() => {
    fetchResponses();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToResponses(pollId, (newResponse) => {
      setResponses(prev => [newResponse, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, [pollId, subscribeToResponses]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const fetchedResponses = await responseService.getPollResponses(pollId);
      setResponses(fetchedResponses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch responses');
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async (data: SubmitResponseData, participantId: string): Promise<Response> => {
    try {
      const response = await responseService.submitResponse(data, participantId);
      // Don't add to state here as realtime will handle it
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
      throw err;
    }
  };

  const deleteResponse = async (responseId: string): Promise<void> => {
    try {
      await responseService.deleteResponse(responseId, pollId);
      setResponses(responses.filter(r => r.$id !== responseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete response');
      throw err;
    }
  };

  return {
    responses,
    loading,
    error,
    submitResponse,
    deleteResponse,
    refetch: fetchResponses,
  };
}

export function useAggregatedResults(pollId: string) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscribeToResponses } = useRealtime();

  useEffect(() => {
    fetchResults();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToResponses(pollId, () => {
      fetchResults();
    });

    return () => {
      unsubscribe();
    };
  }, [pollId, subscribeToResponses]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const aggregated = await responseService.getAggregatedResults(pollId);
      setResults(aggregated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, refetch: fetchResults };
}
