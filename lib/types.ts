// Type definitions for the application
import { Models } from 'appwrite';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export type QuestionType = 
  | 'multiple-choice' 
  | 'yes-no' 
  | 'rating' 
  | 'text' 
  | 'ranking';

export interface User extends Models.Document {
  email: string;
  name: string;
  subscription: SubscriptionTier;
  createdAt: string;
  lastActive: string;
  pollsCreated?: number;
  totalParticipants?: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  description?: string;
  options?: string[];
  required: boolean;
  minRating?: number;
  maxRating?: number;
  allowMultipleAnswers?: boolean;
  order: number;
}

export interface PollSettings {
  allowAnonymous: boolean;
  showResults: 'always' | 'after-submission' | 'never';
  allowMultipleResponses: boolean;
  requireEmail: boolean;
  customBranding?: {
    primaryColor?: string;
    logo?: string;
    organizationName?: string;
  };
  expiresAt?: string;
  maxResponses?: number;
  password?: string;
}

export interface Poll extends Models.Document {
  creatorId: string;
  title: string;
  description?: string;
  questions: Question[];
  settings: PollSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  qrCodeUrl?: string;
  shareableLink?: string;
  responseCount?: number;
  viewCount?: number;
}

export interface Answer {
  questionId: string;
  questionType: QuestionType;
  value: string | string[] | number;
  timestamp: string;
}

export interface Response extends Models.Document {
  pollId: string;
  participantId: string;
  participantEmail?: string;
  participantName?: string;
  answers: Answer[];
  submittedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Session extends Models.Document {
  pollId: string;
  isActive: boolean;
  participantCount: number;
  startedAt: string;
  endedAt?: string;
}

export interface PollAnalytics {
  pollId: string;
  totalResponses: number;
  completionRate: number;
  averageTimeToComplete: number;
  responsesByQuestion: {
    questionId: string;
    questionText: string;
    responses: {
      [key: string]: number;
    };
  }[];
  participationOverTime: {
    timestamp: string;
    count: number;
  }[];
}

export interface CreatePollData {
  title: string;
  description?: string;
  questions: Omit<Question, 'id'>[];
  settings: PollSettings;
}

export interface UpdatePollData {
  title?: string;
  description?: string;
  questions?: Question[];
  settings?: PollSettings;
  isActive?: boolean;
}

export interface SubmitResponseData {
  pollId: string;
  participantEmail?: string;
  participantName?: string;
  answers: Omit<Answer, 'timestamp'>[];
}
