// AI service for generating polls using OpenRouter API
import { CreatePollData, Question } from '@/lib/types';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GeneratedPoll {
  title: string;
  description: string;
  questions: Omit<Question, 'id'>[];
  settings: {
    allowAnonymous: boolean;
    showResults: 'always' | 'after-submission' | 'never';
    allowMultipleResponses: boolean;
    requireEmail: boolean;
  };
}

export class AIService {
  private apiKey: string;
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private model = 'meta-llama/llama-3.2-3b-instruct:free'; // Free model from OpenRouter

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found. AI features will be limited.');
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert poll and survey designer AI assistant. Your task is to generate well-structured, engaging, and purposeful polls based on user requirements.

CRITICAL RULES:
1. You MUST respond ONLY with valid JSON - no markdown, no explanations, no code blocks
2. The JSON must match this exact structure:

{
  "title": "Poll Title Here",
  "description": "Brief description of the poll purpose",
  "questions": [
    {
      "type": "multiple-choice" | "yes-no" | "rating" | "text" | "ranking",
      "question": "The question text",
      "description": "Optional context for the question",
      "options": ["Option 1", "Option 2", "Option 3"],
      "required": true or false,
      "minRating": 1,
      "maxRating": 5,
      "allowMultipleAnswers": false,
      "order": 0
    }
  ],
  "settings": {
    "allowAnonymous": true,
    "showResults": "after-submission",
    "allowMultipleResponses": false,
    "requireEmail": false
  }
}

QUESTION TYPES GUIDE:
- "multiple-choice": Include 2-6 options array, set allowMultipleAnswers (true/false)
- "yes-no": Simple binary choice, no options needed
- "rating": Include minRating (default 1) and maxRating (default 5)
- "text": Open-ended text response, no options needed
- "ranking": Include options array that users will rank

BEST PRACTICES:
1. Create 3-8 questions for optimal engagement
2. Mix question types for variety
3. Use clear, unbiased language
4. Include helpful descriptions for complex questions
5. Set appropriate settings based on poll purpose:
   - Anonymous for sensitive topics
   - Show results after submission for engagement
   - Require email for follow-ups or verification

EXAMPLES OF GOOD POLLS:
- Customer satisfaction: Mix ratings, multiple-choice, and text
- Event planning: Use yes-no, multiple-choice, and preferences
- Product feedback: Ratings, rankings, and open text
- Employee engagement: Mix of all types, anonymous

Remember: Output ONLY the JSON structure, nothing else.`;
  }

  async generatePoll(userPrompt: string): Promise<GeneratedPoll> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'StreamX Poll Builder',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data: OpenRouterResponse = await response.json();
      const generatedContent = data.choices[0]?.message?.content;

      if (!generatedContent) {
        throw new Error('No content generated from AI');
      }

      // Parse the JSON response
      const parsedPoll = this.parseAIResponse(generatedContent);
      
      // Validate the structure
      this.validatePollStructure(parsedPoll);

      return parsedPoll;
    } catch (error) {
      console.error('Error generating poll with AI:', error);
      throw error;
    }
  }

  private parseAIResponse(content: string): GeneratedPoll {
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const parsed = JSON.parse(cleanContent);
      return parsed as GeneratedPoll;
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI-generated poll. Please try again.');
    }
  }

  private validatePollStructure(poll: GeneratedPoll): void {
    if (!poll.title || typeof poll.title !== 'string') {
      throw new Error('Invalid poll structure: missing or invalid title');
    }

    if (!Array.isArray(poll.questions) || poll.questions.length === 0) {
      throw new Error('Invalid poll structure: questions must be a non-empty array');
    }

    const validTypes = ['multiple-choice', 'yes-no', 'rating', 'text', 'ranking'];
    poll.questions.forEach((q, index) => {
      if (!q.type || !validTypes.includes(q.type)) {
        throw new Error(`Invalid question type at index ${index}: ${q.type}`);
      }

      if (!q.question || typeof q.question !== 'string') {
        throw new Error(`Invalid question text at index ${index}`);
      }

      // Validate type-specific requirements
      if ((q.type === 'multiple-choice' || q.type === 'ranking') && (!q.options || q.options.length < 2)) {
        throw new Error(`Question at index ${index} requires at least 2 options`);
      }

      if (q.type === 'rating') {
        if (!q.minRating) q.minRating = 1;
        if (!q.maxRating) q.maxRating = 5;
      }

      // Set defaults
      if (typeof q.required !== 'boolean') q.required = true;
      if (typeof q.order !== 'number') q.order = index;
    });

    if (!poll.settings) {
      poll.settings = {
        allowAnonymous: true,
        showResults: 'after-submission',
        allowMultipleResponses: false,
        requireEmail: false,
      };
    }
  }

  async refinePoll(
    currentPoll: GeneratedPoll,
    refinementPrompt: string
  ): Promise<GeneratedPoll> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
      {
        role: 'user',
        content: `Here is the current poll structure:\n\n${JSON.stringify(currentPoll, null, 2)}\n\nPlease refine it based on this feedback: ${refinementPrompt}`,
      },
    ];

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'StreamX Poll Builder',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      const generatedContent = data.choices[0]?.message?.content;

      if (!generatedContent) {
        throw new Error('No content generated from AI');
      }

      const parsedPoll = this.parseAIResponse(generatedContent);
      this.validatePollStructure(parsedPoll);

      return parsedPoll;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error refining poll with AI:', error.message);
      } else {
        console.error('Error refining poll with AI:', error);
      }
      throw error;
    }
  }

  // Convert GeneratedPoll to CreatePollData format
  convertToCreatePollData(generatedPoll: GeneratedPoll): CreatePollData {
    return {
      title: generatedPoll.title,
      description: generatedPoll.description,
      questions: generatedPoll.questions.map((q, index) => ({
        ...q,
        order: index,
      })),
      settings: {
        ...generatedPoll.settings,
        expiresAt: undefined,
        maxResponses: undefined,
      },
    };
  }
}

export const aiService = new AIService();
