'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, Signal } from 'lucide-react';
import { networkUtils } from '@/lib/network-utils';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast'>('fast');
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      setShowNotification(true);
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => setShowNotification(false), 3000);
    };

    const updateSpeed = () => {
      setSpeed(networkUtils.getConnectionSpeed());
    };

    // Initial check
    setIsOnline(navigator.onLine);
    updateSpeed();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check speed periodically
    const speedInterval = setInterval(updateSpeed, 30000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(speedInterval);
    };
  }, []);

  if (!showNotification && isOnline) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      } ${showNotification ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      <div className="flex items-center gap-3">
        {isOnline ? (
          <>
            <Wifi className="h-5 w-5" />
            <div>
              <p className="font-semibold">Back online</p>
              {speed === 'slow' && (
                <p className="text-xs opacity-90">Connection is slow</p>
              )}
            </div>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5" />
            <div>
              <p className="font-semibold">You&apos;re offline</p>
              <p className="text-xs opacity-90">Check your connection</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ConnectionSpeedIndicator() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSpeed = () => {
      const currentSpeed = networkUtils.getConnectionSpeed();
      setShow(currentSpeed === 'slow');
    };

    updateSpeed();
    const interval = setInterval(updateSpeed, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg shadow-lg flex items-center gap-2">
      <Signal className="h-4 w-4" />
      <span>Slow connection detected</span>
    </div>
  );
}
