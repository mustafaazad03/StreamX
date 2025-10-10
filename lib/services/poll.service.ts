// Poll service for CRUD operations
import { databases, DATABASE_ID, POLLS_COLLECTION_ID, SESSIONS_COLLECTION_ID } from '@/lib/appwrite';
import { Poll, CreatePollData, UpdatePollData, Session } from '@/lib/types';
import { ID, Query } from 'appwrite';
import QRCode from 'qrcode';

export class PollService {
  // Create a new poll
  async createPoll(userId: string, data: CreatePollData): Promise<Poll> {
    try {
      const pollId = ID.unique();
      
      // Generate shareable link
      const shareableLink = `${process.env.NEXT_PUBLIC_APP_URL}/poll/${pollId}`;
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(shareableLink, {
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Add IDs to questions
      const questionsWithIds = data.questions.map((q, index) => ({
        ...q,
        id: ID.unique(),
        order: index,
      }));

      const pollData = {
        creatorId: userId,
        title: data.title,
        description: data.description || '',
        questions: JSON.stringify(questionsWithIds),
        settings: JSON.stringify(data.settings),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        qrCodeUrl: qrCodeDataUrl,
        shareableLink,
        responseCount: 0,
        viewCount: 0,
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        POLLS_COLLECTION_ID,
        pollId,
        pollData
      );

      // Create session for the poll
      await this.createSession(pollId);

      return this.transformPollDocument(response);
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  }

  // Get poll by ID
  async getPoll(pollId: string): Promise<Poll> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        POLLS_COLLECTION_ID,
        pollId
      );

      // Increment view count
      await databases.updateDocument(
        DATABASE_ID,
        POLLS_COLLECTION_ID,
        pollId,
        { viewCount: (response.viewCount || 0) + 1 }
      );

      return this.transformPollDocument(response);
    } catch (error) {
      console.error('Error getting poll:', error);
      throw error;
    }
  }

  // Get all polls for a user
  async getUserPolls(userId: string, limit = 100, offset = 0): Promise<Poll[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        POLLS_COLLECTION_ID,
        [
          Query.equal('creatorId', userId),
          Query.orderDesc('createdAt'),
          Query.limit(limit),
          Query.offset(offset),
        ]
      );

      return response.documents.map(doc => this.transformPollDocument(doc));
    } catch (error) {
      console.error('Error getting user polls:', error);
      throw error;
    }
  }

  // Update poll
  async updatePoll(pollId: string, data: UpdatePollData): Promise<Poll> {
    try {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.questions) updateData.questions = JSON.stringify(data.questions);
      if (data.settings) updateData.settings = JSON.stringify(data.settings);
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const response = await databases.updateDocument(
        DATABASE_ID,
        POLLS_COLLECTION_ID,
        pollId,
        updateData
      );

      return this.transformPollDocument(response);
    } catch (error) {
      console.error('Error updating poll:', error);
      throw error;
    }
  }

  // Delete poll
  async deletePoll(pollId: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, POLLS_COLLECTION_ID, pollId);
    } catch (error) {
      console.error('Error deleting poll:', error);
      throw error;
    }
  }

  // Toggle poll active status
  async togglePollStatus(pollId: string, isActive: boolean): Promise<Poll> {
    return this.updatePoll(pollId, { isActive });
  }

  // Create session for poll
  private async createSession(pollId: string): Promise<Session> {
    try {
      const sessionData = {
        pollId,
        isActive: true,
        participantCount: 0,
        startedAt: new Date().toISOString(),
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        SESSIONS_COLLECTION_ID,
        ID.unique(),
        sessionData
      );

      return response as unknown as Session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Get session for poll
  async getSession(pollId: string): Promise<Session | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        SESSIONS_COLLECTION_ID,
        [Query.equal('pollId', pollId), Query.orderDesc('startedAt'), Query.limit(1)]
      );

      return response.documents.length > 0 ? (response.documents[0] as unknown as Session) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Update session participant count
  async updateSessionParticipantCount(sessionId: string, count: number): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        SESSIONS_COLLECTION_ID,
        sessionId,
        { participantCount: count }
      );
    } catch (error) {
      console.error('Error updating session participant count:', error);
    }
  }

  // Regenerate QR code
  async regenerateQRCode(pollId: string): Promise<string> {
    try {
      const shareableLink = `${process.env.NEXT_PUBLIC_APP_URL}/poll/${pollId}`;
      
      const qrCodeDataUrl = await QRCode.toDataURL(shareableLink, {
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      await databases.updateDocument(
        DATABASE_ID,
        POLLS_COLLECTION_ID,
        pollId,
        { qrCodeUrl: qrCodeDataUrl }
      );

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      throw error;
    }
  }

  // Transform document to Poll type
  private transformPollDocument(doc: any): Poll {
    return {
      ...doc,
      questions: typeof doc.questions === 'string' ? JSON.parse(doc.questions) : doc.questions,
      settings: typeof doc.settings === 'string' ? JSON.parse(doc.settings) : doc.settings,
    } as Poll;
  }

  // Search polls
  async searchPolls(userId: string, searchTerm: string): Promise<Poll[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        POLLS_COLLECTION_ID,
        [
          Query.equal('creatorId', userId),
          Query.search('title', searchTerm),
          Query.orderDesc('createdAt'),
        ]
      );

      return response.documents.map(doc => this.transformPollDocument(doc));
    } catch (error) {
      console.error('Error searching polls:', error);
      throw error;
    }
  }

  // Get poll statistics
  async getPollStats(userId: string): Promise<{
    totalPolls: number;
    activePolls: number;
    totalResponses: number;
    totalViews: number;
  }> {
    try {
      const polls = await this.getUserPolls(userId, 1000);
      
      return {
        totalPolls: polls.length,
        activePolls: polls.filter(p => p.isActive).length,
        totalResponses: polls.reduce((sum, p) => sum + (p.responseCount || 0), 0),
        totalViews: polls.reduce((sum, p) => sum + (p.viewCount || 0), 0),
      };
    } catch (error) {
      console.error('Error getting poll stats:', error);
      throw error;
    }
  }
}

export const pollService = new PollService();
