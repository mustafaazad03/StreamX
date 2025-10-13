// Response service for handling poll submissions
import { databases, DATABASE_ID, RESPONSES_COLLECTION_ID, POLLS_COLLECTION_ID } from '@/lib/appwrite';
import { Response, SubmitResponseData, Answer } from '@/lib/types';
import { ID, Query } from 'appwrite';

export class ResponseService {
  private responseCache: Map<string, { responses: Response[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10000; // 10 seconds for responses

  // Submit a poll response
  async submitResponse(data: SubmitResponseData, participantId: string): Promise<Response> {
    try {
      // Add timestamps to answers
      const answersWithTimestamp: Answer[] = data.answers.map(answer => ({
        ...answer,
        timestamp: new Date().toISOString(),
      }));

      const responseData = {
        pollId: data.pollId,
        participantId,
        participantEmail: data.participantEmail || '',
        participantName: data.participantName || '',
        answers: JSON.stringify(answersWithTimestamp),
        submittedAt: new Date().toISOString(),
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        RESPONSES_COLLECTION_ID,
        ID.unique(),
        responseData
      );

      // Update poll response count asynchronously
      this.updatePollResponseCount(data.pollId).catch(err => 
        console.error('Failed to update response count:', err)
      );

      // Clear cache for this poll
      this.responseCache.delete(data.pollId);

      return this.transformResponseDocument(response);
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  }

  // Get all responses for a poll with caching
  async getPollResponses(pollId: string, limit = 1000): Promise<Response[]> {
    try {
      // Check cache
      const cached = this.responseCache.get(pollId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.responses;
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        RESPONSES_COLLECTION_ID,
        [
          Query.equal('pollId', pollId),
          Query.orderDesc('submittedAt'),
          Query.limit(limit),
        ]
      );

      const responses = response.documents.map(doc => this.transformResponseDocument(doc));
      
      // Cache the responses
      this.responseCache.set(pollId, { responses, timestamp: Date.now() });

      return responses;
    } catch (error) {
      console.error('Error getting poll responses:', error);
      throw error;
    }
  }

  // Get response by ID
  async getResponse(responseId: string): Promise<Response> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        RESPONSES_COLLECTION_ID,
        responseId
      );

      return this.transformResponseDocument(response);
    } catch (error) {
      console.error('Error getting response:', error);
      throw error;
    }
  }

  // Check if participant has already responded
  async hasParticipantResponded(pollId: string, participantId: string): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        RESPONSES_COLLECTION_ID,
        [
          Query.equal('pollId', pollId),
          Query.equal('participantId', participantId),
          Query.limit(1),
        ]
      );

      return response.documents.length > 0;
    } catch (error) {
      console.error('Error checking participant response:', error);
      return false;
    }
  }

  // Delete response
  async deleteResponse(responseId: string, pollId: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, RESPONSES_COLLECTION_ID, responseId);
      // Clear cache
      this.responseCache.delete(pollId);
      // Update count asynchronously
      this.updatePollResponseCount(pollId).catch(err => 
        console.error('Failed to update response count:', err)
      );
    } catch (error) {
      console.error('Error deleting response:', error);
      throw error;
    }
  }

  // Get response count for poll
  async getResponseCount(pollId: string): Promise<number> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        RESPONSES_COLLECTION_ID,
        [Query.equal('pollId', pollId), Query.limit(1)]
      );

      return response.total;
    } catch (error) {
      console.error('Error getting response count:', error);
      return 0;
    }
  }

  // Get user's participated polls with their responses
  async getUserParticipatedPolls(participantId: string, limit = 100): Promise<{
    pollId: string;
    response: Response;
  }[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        RESPONSES_COLLECTION_ID,
        [
          Query.equal('participantId', participantId),
          Query.orderDesc('submittedAt'),
          Query.limit(limit),
        ]
      );

      return response.documents.map(doc => ({
        pollId: doc.pollId as string,
        response: this.transformResponseDocument(doc),
      }));
    } catch (error) {
      console.error('Error getting user participated polls:', error);
      return [];
    }
  }

  // Update poll response count
  private async updatePollResponseCount(pollId: string): Promise<void> {
    try {
      const count = await this.getResponseCount(pollId);
      await databases.updateDocument(
        DATABASE_ID,
        POLLS_COLLECTION_ID,
        pollId,
        { responseCount: count }
      );
    } catch (error) {
      console.error('Error updating poll response count:', error);
    }
  }

  // Get aggregated results for a poll
  async getAggregatedResults(pollId: string): Promise<{ totalResponses: number; questionResults: unknown[]; responses: unknown[] }> {
    try {
      const responses = await this.getPollResponses(pollId);
      
      if (responses.length === 0) {
        return { totalResponses: 0, questionResults: [], responses: [] };
      }

      // Group responses by question
      const questionResults: Record<string, { questionId: string; questionType: string; responses: Record<string, number>; totalResponses: number; textResponses?: string[] }> = {};

      responses.forEach(response => {
        response.answers.forEach(answer => {
          if (!questionResults[answer.questionId]) {
            questionResults[answer.questionId] = {
              questionId: answer.questionId,
              questionType: answer.questionType,
              responses: {},
              totalResponses: 0,
            };
          }

          questionResults[answer.questionId].totalResponses++;

          // Aggregate based on question type
          if (answer.questionType === 'multiple-choice' || answer.questionType === 'yes-no') {
            const value = Array.isArray(answer.value) ? answer.value : [answer.value];
            value.forEach(v => {
              const key = String(v);
              questionResults[answer.questionId].responses[key] = 
                (questionResults[answer.questionId].responses[key] || 0) + 1;
            });
          } else if (answer.questionType === 'rating') {
            const key = String(answer.value);
            questionResults[answer.questionId].responses[key] = 
              (questionResults[answer.questionId].responses[key] || 0) + 1;
          } else if (answer.questionType === 'text') {
            if (!questionResults[answer.questionId].textResponses) {
              questionResults[answer.questionId].textResponses = [];
            }
            questionResults[answer.questionId].textResponses?.push(String(answer.value));
          }
        });
      });

      return {
        totalResponses: responses.length,
        questionResults: Object.values(questionResults),
        responses: responses.map(r => ({
          participantName: r.participantName,
          participantEmail: r.participantEmail,
          submittedAt: r.submittedAt,
          answers: r.answers,
        })),
      };
    } catch (error) {
      console.error('Error getting aggregated results:', error);
      throw error;
    }
  }

  // Export responses to CSV
  async exportToCSV(pollId: string): Promise<string> {
    try {
      const responses = await this.getPollResponses(pollId);
      
      if (responses.length === 0) {
        return 'No responses available';
      }

      // Create CSV headers
      const headers = ['Participant Name', 'Participant Email', 'Submitted At'];
      const firstResponse = responses[0];
      firstResponse.answers.forEach(answer => {
        headers.push(`Question ${answer.questionId}`);
      });

      // Create CSV rows
      const rows = responses.map(response => {
        const row = [
          response.participantName || 'Anonymous',
          response.participantEmail || '',
          response.submittedAt,
        ];

        response.answers.forEach(answer => {
          row.push(Array.isArray(answer.value) ? answer.value.join(', ') : String(answer.value));
        });

        return row;
      });

      // Combine headers and rows
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      return csv;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  // Transform document to Response type
  private transformResponseDocument(doc: Record<string, unknown>): Response {
    // Safely parse answers - handle both string and already parsed cases
    let parsedAnswers;
    
    if (typeof doc.answers === 'string') {
      try {
        parsedAnswers = JSON.parse(doc.answers);
      } catch (error) {
        console.error('Failed to parse answers JSON:', error);
        parsedAnswers = [];
      }
    } else if (Array.isArray(doc.answers)) {
      parsedAnswers = doc.answers;
    } else {
      console.warn('Unexpected answers format:', typeof doc.answers);
      parsedAnswers = [];
    }
    
    return {
      ...doc,
      answers: parsedAnswers,
    } as Response;
  }

  // Get responses in real-time
  // subscribeToResponses will be implemented with Appwrite Realtime when needed
}

export const responseService = new ResponseService();
