'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { client } from '@/lib/appwrite';
import { Response } from '@/lib/types';
import { RESPONSES_COLLECTION_ID, DATABASE_ID } from '@/lib/appwrite';

interface RealtimeContextType {
  subscribeToResponses: (pollId: string, callback: (response: any) => void) => () => void;
  subscribeToPoll: (pollId: string, callback: (poll: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const subscribeToResponses = useCallback((pollId: string, callback: (response: any) => void) => {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${RESPONSES_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          const payload = response.payload as any;
          if (payload.pollId === pollId) {
            callback(payload);
          }
        }
      }
    );

    return unsubscribe;
  }, []);

  const subscribeToPoll = useCallback((pollId: string, callback: (poll: any) => void) => {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.*.documents.${pollId}`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          callback(response.payload);
        }
      }
    );

    return unsubscribe;
  }, []);

  return (
    <RealtimeContext.Provider value={{ subscribeToResponses, subscribeToPoll }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
