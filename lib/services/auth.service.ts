// Authentication service
import { account } from '@/lib/appwrite';
import { ID, Models, OAuthProvider } from 'appwrite';

export class AuthService {
  // Email/Password Authentication
  async createAccount(email: string, password: string, name: string): Promise<Models.User<Models.Preferences>> {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      // Automatically log in after registration
      await this.login(email, password);
      return user;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<Models.Session> {
    try {
      return await account.createEmailPasswordSession(email, password);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
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
    } catch (error: any) {
      // If error is about existing session, try to get current session
      if (error.code === 401 || error.type === 'user_session_already_exists') {
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
