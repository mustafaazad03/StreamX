'use client';

import { useState, useEffect } from 'react';
import { pollService } from '@/lib/services/poll.service';
import { Poll, CreatePollData, UpdatePollData } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPolls();
    }
  }, [user]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      if (user) {
        const userPolls = await pollService.getUserPolls(user.$id);
        setPolls(userPolls);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch polls');
    } finally {
      setLoading(false);
    }
  };

  const createPoll = async (data: CreatePollData): Promise<Poll> => {
    try {
      if (!user) throw new Error('User not authenticated');
      const poll = await pollService.createPoll(user.$id, data);
      setPolls([poll, ...polls]);
      return poll;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll');
      throw err;
    }
  };

  const updatePoll = async (pollId: string, data: UpdatePollData): Promise<Poll> => {
    try {
      const updatedPoll = await pollService.updatePoll(pollId, data);
      setPolls(polls.map(p => p.$id === pollId ? updatedPoll : p));
      return updatedPoll;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update poll');
      throw err;
    }
  };

  const deletePoll = async (pollId: string): Promise<void> => {
    try {
      await pollService.deletePoll(pollId);
      setPolls(polls.filter(p => p.$id !== pollId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete poll');
      throw err;
    }
  };

  const togglePollStatus = async (pollId: string, isActive: boolean): Promise<void> => {
    try {
      const updatedPoll = await pollService.togglePollStatus(pollId, isActive);
      setPolls(polls.map(p => p.$id === pollId ? updatedPoll : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle poll status');
      throw err;
    }
  };

  return {
    polls,
    loading,
    error,
    createPoll,
    updatePoll,
    deletePoll,
    togglePollStatus,
    refetch: fetchPolls,
  };
}

export function usePoll(pollId: string) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (pollId) {
      fetchPoll();
    }
  }, [pollId, retryAttempt]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPoll = await pollService.getPoll(pollId);
      setPoll(fetchedPoll);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch poll';
      setError(errorMessage);
      console.error('Error fetching poll:', err);
      
      // Auto-retry logic for network issues
      if (retryAttempt < 2) {
        setTimeout(() => {
          setRetryAttempt(prev => prev + 1);
        }, 1000 * (retryAttempt + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  return { poll, loading, error, refetch: fetchPoll };
}
