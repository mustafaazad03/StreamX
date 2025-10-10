'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Models } from 'appwrite';
import { authService } from '@/lib/services/auth.service';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  session: Models.Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  createAnonymousSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [session, setSession] = useState<Models.Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      const currentSession = await authService.getCurrentSession();
      
      setUser(currentUser);
      setSession(currentSession);
    } catch (error) {
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const newSession = await authService.login(email, password);
      const currentUser = await authService.getCurrentUser();
      
      setSession(newSession);
      setUser(currentUser);
      
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      await authService.createAccount(email, password, name);
      const currentUser = await authService.getCurrentUser();
      const currentSession = await authService.getCurrentSession();
      
      setUser(currentUser);
      setSession(currentSession);
      
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setSession(null);
      router.push('/');
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      await authService.loginWithGoogle();
    } catch (error) {
      throw error;
    }
  };

  const loginWithGithub = async () => {
    try {
      await authService.loginWithGithub();
    } catch (error) {
      throw error;
    }
  };

  const createAnonymousSession = async () => {
    try {
      const newSession = await authService.createAnonymousSession();
      setSession(newSession);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        loginWithGithub,
        createAnonymousSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
