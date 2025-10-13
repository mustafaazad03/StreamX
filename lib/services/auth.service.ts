import { account } from '@/lib/appwrite';
import { ID, Models, OAuthProvider } from 'appwrite';

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on auth errors (401, 409, etc.)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      if (err?.code === 401 || err?.code === 409 || err?.type?.includes('user_')) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

export class AuthService {
  /**
   * Utility method to safely delete all sessions
   * Useful for ensuring clean state before authentication
   */
  async deleteAllSessions(): Promise<void> {
    try {
      await account.deleteSessions();
    } catch (error) {
      console.warn('Failed to delete sessions:', error);
      // Ignore errors - this is a cleanup operation
    }
  }

  /**
   * Utility method to safely delete current session
   */
  async deleteCurrentSession(): Promise<void> {
    try {
      await account.deleteSession('current');
    } catch (error) {
      // Ignore 401 errors (no active session)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any)?.code !== 401) {
        console.warn('Failed to delete current session:', error);
      }
    }
  }

  // Email/Password Authentication
  async createAccount(email: string, password: string, name: string): Promise<Models.User<Models.Preferences>> {
    try {
      // Validate inputs
      if (!email || !password || !name) {
        throw new Error('All fields are required');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Check and delete any existing anonymous session
      let existingSession: Models.Session | null = null;
      try {
        existingSession = await this.getCurrentSession();
      } catch (error) {
        // No existing session
        console.log('No existing session found during registration');
      }

      if (existingSession) {
        try {
          await retryWithBackoff(() => account.deleteSession('current'));
          console.log('Deleted existing session before registration');
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (deleteError) {
          console.warn('Failed to delete existing session during registration:', deleteError);
          
          // Try to delete all sessions
          try {
            await retryWithBackoff(() => account.deleteSessions());
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (fallbackError) {
            console.warn('Failed to delete all sessions:', fallbackError);
          }
        }
      }
      
      // Create new account with retry logic
      console.log('Creating account for:', email);
      const user = await retryWithBackoff(() => 
        account.create(ID.unique(), email, password, name),
        3, // max retries
        1000 // initial delay of 1 second
      );
      console.log('Account created successfully');
      
      // Small delay before login
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Automatically log in after registration
      try {
        await this.login(email, password);
      } catch (loginError) {
        console.warn('Auto-login failed after registration:', loginError);
        // Don't fail registration if auto-login fails
        // User can manually login
      }
      
      return user;
    } catch (error) {
      console.error('Error creating account:', error);
      
      // Provide user-friendly error messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      
      if (err?.type === 'user_already_exists') {
        throw new Error('An account with this email already exists');
      } else if (err?.type === 'user_password_mismatch') {
        throw new Error('Password does not meet requirements');
      } else if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (err?.code === 503 || err?.code === 500) {
        throw new Error('Service temporarily unavailable. Please try again in a moment.');
      } else if (err?.message) {
        throw new Error(err.message);
      }
      
      throw new Error('Failed to create account. Please try again.');
    }
  }

  async login(email: string, password: string): Promise<Models.Session> {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Check if there's an existing session
      let existingSession: Models.Session | null = null;
      try {
        existingSession = await this.getCurrentSession();
      } catch (error) {
        // No existing session, continue
        console.log('No existing session found');
      }
      
      if (existingSession) {
        // Delete the existing session before creating a new one
        // This handles both anonymous and authenticated sessions
        try {
          await retryWithBackoff(() => account.deleteSession('current'));
          console.log('Deleted existing session before login');
          
          // Small delay to ensure session is fully deleted
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (deleteError) {
          console.warn('Failed to delete existing session:', deleteError);
          
          // Try to delete all sessions as a fallback
          try {
            await retryWithBackoff(() => account.deleteSessions());
            console.log('Deleted all sessions as fallback');
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (fallbackError) {
            console.warn('Failed to delete all sessions:', fallbackError);
          }
        }
      }
      
      // Create new email/password session with retry logic
      console.log('Attempting login for:', email);
      const session = await retryWithBackoff(() => 
        account.createEmailPasswordSession(email, password),
        3, // max retries
        1000 // initial delay
      );
      console.log('Login successful');
      return session;
    } catch (error) {
      console.error('Error logging in:', error);
      
      // Provide user-friendly error messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      
      if (err?.code === 401 || err?.type === 'user_invalid_credentials') {
        throw new Error('Invalid email or password');
      } else if (err?.type === 'user_session_already_exists') {
        // If session already exists error, try one more time after cleanup
        try {
          await retryWithBackoff(() => account.deleteSessions());
          await new Promise(resolve => setTimeout(resolve, 300));
          return await retryWithBackoff(() => 
            account.createEmailPasswordSession(email, password)
          );
        } catch (retryError) {
          throw new Error('Login failed. Please try again.');
        }
      } else if (err?.type === 'user_blocked') {
        throw new Error('Your account has been blocked. Please contact support.');
      } else if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (err?.code === 503 || err?.code === 500) {
        throw new Error('Service temporarily unavailable. Please try again in a moment.');
      } else if (err?.message) {
        throw new Error(err.message);
      }
      
      throw new Error('Login failed. Please try again.');
    }
  }

  async logout(): Promise<void> {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Error logging out:', error);
      // Don't throw error if there's no session to delete
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any)?.code !== 401) {
        throw error;
      }
    }
  }

  async getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
    try {
      return await account.get();
    } catch {
      return null;
    }
  }

  async getCurrentSession(): Promise<Models.Session | null> {
    try {
      return await account.getSession('current');
    } catch {
      return null;
    }
  }

  // Anonymous Session for Poll Participants
  async createAnonymousSession(): Promise<Models.Session> {
    try {
      // First check if there's already an active session
      const existingSession = await this.getCurrentSession();
      if (existingSession) {
        // If session already exists, return it
        return existingSession;
      }
      
      // Only create a new anonymous session if none exists
      return await account.createAnonymousSession();
    } catch (error: unknown) {
      // If error is about existing session, try to get current session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      if (err.code === 401 || err.type === 'user_session_already_exists') {
        const session = await this.getCurrentSession();
        if (session) {
          return session;
        }
      }
      console.error('Error creating anonymous session:', error);
      throw error;
    }
  }

  // OAuth Authentication
  async loginWithGoogle(): Promise<void> {
    try {
      account.createOAuth2Session(
        OAuthProvider.Google,
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/error`
      );
    } catch (error) {
      console.error('Error logging in with Google:', error);
      throw error;
    }
  }

  async loginWithGithub(): Promise<void> {
    try {
      account.createOAuth2Session(
        OAuthProvider.Github,
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/error`
      );
    } catch (error) {
      console.error('Error logging in with Github:', error);
      throw error;
    }
  }

  // Password Recovery
  async sendPasswordRecovery(email: string): Promise<void> {
    try {
      await account.createRecovery(
        email,
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
      );
    } catch (error) {
      console.error('Error sending password recovery:', error);
      throw error;
    }
  }

  async resetPassword(userId: string, secret: string, password: string): Promise<void> {
    try {
      await account.updateRecovery(userId, secret, password);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  // Update user preferences
  async updatePreferences(prefs: Models.Preferences): Promise<Models.User<Models.Preferences>> {
    try {
      return await account.updatePrefs(prefs);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  // Verify email
  async sendVerificationEmail(): Promise<void> {
    try {
      await account.createVerification(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`
      );
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  async verifyEmail(userId: string, secret: string): Promise<void> {
    try {
      await account.updateVerification(userId, secret);
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
