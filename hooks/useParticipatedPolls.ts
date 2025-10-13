'use client';

import { useState, useEffect } from 'react';
import { responseService } from '@/lib/services/response.service';
import { pollService } from '@/lib/services/poll.service';
import { Poll, Response } from '@/lib/types';

export interface ParticipatedPoll {
  poll: Poll;
  response: Response;
  submittedAt: string;
}

export function useParticipatedPolls(userId: string | undefined) {
  const [participatedPolls, setParticipatedPolls] = useState<ParticipatedPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchParticipatedPolls();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchParticipatedPolls = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get all responses by this user
      const userResponses = await responseService.getUserParticipatedPolls(userId);
      
      // Fetch poll details for each response
      const pollsWithResponses = await Promise.all(
        userResponses.map(async ({ pollId, response }) => {
          try {
            const poll = await pollService.getPoll(pollId);
            return {
              poll,
              response,
              submittedAt: response.submittedAt || response.$createdAt,
            };
          } catch (error) {
            console.error(`Failed to fetch poll ${pollId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null values (failed polls)
      const validPolls = pollsWithResponses.filter((p): p is ParticipatedPoll => p !== null);
      
      setParticipatedPolls(validPolls);
    } catch (err) {
      console.error('Error fetching participated polls:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch participated polls');
    } finally {
      setLoading(false);
    }
  };

  return {
    participatedPolls,
    loading,
    error,
    refetch: fetchParticipatedPolls,
  };
}
