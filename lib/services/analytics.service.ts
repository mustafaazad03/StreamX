// Analytics service
import { responseService } from './response.service';
import { pollService } from './poll.service';

interface QuestionAnalyticsResult {
  questionId: string;
  questionText: string;
  responses: Record<string, number>;
}

interface AggregatedQuestionResult {
  questionId: string;
  questionText: string;
  responses: Record<string, number>;
}

export class AnalyticsService {
  // Get comprehensive analytics for a poll
  async getQuestionAnalytics(pollId: string): Promise<{
    pollId: string;
    totalResponses: number;
    completionRate: number;
    averageTimeToComplete: number;
    responsesByQuestion: QuestionAnalyticsResult[];
    participationOverTime: { timestamp: string; count: number }[];
  }> {
    try {
      const poll = await pollService.getPoll(pollId);
      const responses = await responseService.getPollResponses(pollId);
      const aggregated = await responseService.getAggregatedResults(pollId);

      // Calculate completion rate (assuming all questions are required)
      const completionRate = responses.length > 0 
        ? (responses.filter(r => r.answers.length === poll.questions.length).length / responses.length) * 100 
        : 0;

      // Calculate average time to complete
      const timeToComplete = responses.map(r => {
        const submitted = new Date(r.submittedAt || Date.now()).getTime();
        const firstAnswer = new Date(r.answers[0]?.timestamp || r.submittedAt || Date.now()).getTime();
        return submitted - firstAnswer;
      });

      const averageTimeToComplete = timeToComplete.length > 0
        ? timeToComplete.reduce((sum, time) => sum + time, 0) / timeToComplete.length
        : 0;

      // Participation over time (grouped by hour)
      const participationOverTime = this.groupResponsesByTime(responses);

      // Response by question
      const responsesByQuestion = poll.questions.map(question => {
        const questionResult = (aggregated.questionResults as AggregatedQuestionResult[]).find(
          (qr) => qr.questionId === question.id
        );

        return {
          questionId: question.id,
          questionText: question.question,
          responses: questionResult?.responses || {},
        };
      });

      return {
        pollId,
        totalResponses: responses.length,
        completionRate,
        averageTimeToComplete: averageTimeToComplete / 1000, // Convert to seconds
        responsesByQuestion,
        participationOverTime,
      };
    } catch (error) {
      console.error('Error getting poll analytics:', error);
      throw error;
    }
  }

  // Group responses by time intervals
  private groupResponsesByTime(responses: Array<{ submittedAt?: string; $createdAt?: string }>): { timestamp: string; count: number }[] {
    const grouped: { [key: string]: number } = {};

    responses.forEach(response => {
      const date = new Date(response.submittedAt || response.$createdAt || Date.now());
      const hour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
      const key = hour.toISOString();

      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Get user statistics
  async getUserStatistics(userId: string): Promise<{
    totalPolls: number;
    activePolls: number;
    totalResponses: number;
    totalViews: number;
    averageResponsesPerPoll: number;
    mostPopularPoll: { id: string; title: string; responses: number } | null;
  }> {
    try {
      const stats = await pollService.getPollStats(userId);
      const polls = await pollService.getUserPolls(userId);

      const averageResponsesPerPoll = polls.length > 0
        ? stats.totalResponses / polls.length
        : 0;

      const mostPopularPoll = polls.length > 0
        ? polls.reduce((prev, current) => 
            (current.responseCount || 0) > (prev.responseCount || 0) ? current : prev
          )
        : null;

      return {
        ...stats,
        averageResponsesPerPoll,
        mostPopularPoll: mostPopularPoll 
          ? { 
              id: mostPopularPoll.$id, 
              title: mostPopularPoll.title, 
              responses: mostPopularPoll.responseCount || 0 
            }
          : null,
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }

  // Calculate engagement metrics
  async getEngagementMetrics(pollId: string): Promise<{
    responseRate: number;
    averageCompletionTime: number;
    abandonmentRate: number;
    peakResponseTime: string;
  }> {
    try {
      const poll = await pollService.getPoll(pollId);
      const analytics = await this.getPollAnalytics(pollId);

      const responseRate = (poll.viewCount ?? 0) > 0 
        ? ((poll.responseCount || 0) / (poll.viewCount ?? 1)) * 100 
        : 0;

      const abandonmentRate = 100 - analytics.completionRate;

      const peakResponseTime = analytics.participationOverTime.length > 0
        ? analytics.participationOverTime.reduce((prev: { timestamp: string; count: number }, current: { timestamp: string; count: number }) =>
            current.count > prev.count ? current : prev
          ).timestamp
        : '';

      return {
        responseRate,
        averageCompletionTime: analytics.averageTimeToComplete,
        abandonmentRate,
        peakResponseTime,
      };
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      throw error;
    }
  }

  // Get poll analytics (alias for getQuestionAnalytics)
  async getPollAnalytics(pollId: string) {
    return this.getQuestionAnalytics(pollId);
  }
}

export const analyticsService = new AnalyticsService();
