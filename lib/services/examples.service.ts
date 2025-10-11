// Service for managing AI-generated example prompts with caching
export interface ExamplePrompt {
  text: string;
  category: string;
  generatedAt: number;
}

interface CachedExamples {
  examples: ExamplePrompt[];
  timestamp: number;
  version: number;
}

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const STORAGE_KEY = 'ai_poll_examples_cache';
const CACHE_VERSION = 1;

// Fallback examples if AI generation fails or cache is empty
const FALLBACK_EXAMPLES: ExamplePrompt[] = [
  {
    text: "Create a customer satisfaction survey for a restaurant with questions about food quality, service, and atmosphere",
    category: "Customer Feedback",
    generatedAt: Date.now(),
  },
  {
    text: "Build an employee engagement poll with 5 questions focusing on work-life balance and job satisfaction",
    category: "HR & People",
    generatedAt: Date.now(),
  },
  {
    text: "Design a product feedback form for a mobile app with rating scales and feature requests",
    category: "Product Development",
    generatedAt: Date.now(),
  },
  {
    text: "Create a team event planning poll with questions about date preferences, location, and activities",
    category: "Event Planning",
    generatedAt: Date.now(),
  },
  {
    text: "Generate a market research survey about coffee consumption habits and preferences",
    category: "Market Research",
    generatedAt: Date.now(),
  },
  {
    text: "Build a training effectiveness assessment with questions about content quality and learning outcomes",
    category: "Education & Training",
    generatedAt: Date.now(),
  },
];

export class ExamplesService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
  }

  /**
   * Get examples with caching and auto-refresh logic
   */
  async getExamples(): Promise<ExamplePrompt[]> {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return FALLBACK_EXAMPLES;
      }

      const cached = this.getCachedExamples();

      // Return cached examples if valid
      if (cached && this.isCacheValid(cached)) {
        return cached.examples;
      }

      // Try to generate new examples
      if (this.apiKey) {
        try {
          const newExamples = await this.generateExamples();
          this.cacheExamples(newExamples);
          return newExamples;
        } catch (error) {
          console.warn('Failed to generate new examples, using fallback:', error);
          // If generation fails but we have cached examples, use them even if expired
          if (cached?.examples) {
            return cached.examples;
          }
        }
      }

      // Return fallback examples
      return FALLBACK_EXAMPLES;
    } catch (error) {
      console.error('Error in getExamples:', error);
      return FALLBACK_EXAMPLES;
    }
  }

  /**
   * Generate new example prompts using AI
   */
  private async generateExamples(): Promise<ExamplePrompt[]> {
    const systemPrompt = `You are an expert at creating diverse, engaging poll prompt examples. Generate 6 unique, high-quality poll creation prompts across different categories.

CRITICAL RULES:
1. Respond ONLY with valid JSON - no markdown, no explanations
2. Each example should be specific and actionable
3. Cover diverse use cases and industries
4. Make prompts clear and professional
5. Include variety in poll types and purposes

Required JSON structure:
{
  "examples": [
    {
      "text": "Specific poll creation prompt here",
      "category": "Category name"
    }
  ]
}

Categories to cover:
- Customer Feedback
- HR & People
- Product Development
- Event Planning
- Market Research
- Education & Training

Make each prompt:
- 10-20 words long
- Specific about the poll purpose
- Include context (industry, target audience, or use case)
- Actionable and clear

Example format: "Create a [type] for [audience] with questions about [topics]"`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://streamx.appwrite.network',
          'X-Title': 'StreamX Examples Generator',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: 'Generate 6 diverse poll creation prompt examples.',
            },
          ],
          temperature: 0.9, // Higher temperature for more variety
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content generated');
      }

      // Parse the response
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const parsed = JSON.parse(cleanContent);

      if (!parsed.examples || !Array.isArray(parsed.examples)) {
        throw new Error('Invalid response structure');
      }

      // Add timestamp to each example
      const examples: ExamplePrompt[] = parsed.examples.map((ex: { text: string; category: string }) => ({
        text: ex.text,
        category: ex.category,
        generatedAt: Date.now(),
      }));

      // Validate we have enough examples
      if (examples.length < 3) {
        throw new Error('Not enough examples generated');
      }

      return examples.slice(0, 6); // Return max 6 examples
    } catch (error) {
      console.error('Error generating examples:', error);
      throw error;
    }
  }

  /**
   * Get cached examples from sessionStorage
   */
  private getCachedExamples(): CachedExamples | null {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (!cached) {
        return null;
      }

      const parsed: CachedExamples = JSON.parse(cached);

      // Check version compatibility
      if (parsed.version !== CACHE_VERSION) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  /**
   * Cache examples in sessionStorage
   */
  private cacheExamples(examples: ExamplePrompt[]): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      const cache: CachedExamples = {
        examples,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching examples:', error);
    }
  }

  /**
   * Check if cached data is still valid (within 2 hours)
   */
  private isCacheValid(cache: CachedExamples): boolean {
    const age = Date.now() - cache.timestamp;
    return age < CACHE_DURATION;
  }

  /**
   * Force refresh examples (bypasses cache)
   */
  async refreshExamples(): Promise<ExamplePrompt[]> {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEY);
      }

      if (this.apiKey) {
        const newExamples = await this.generateExamples();
        this.cacheExamples(newExamples);
        return newExamples;
      }

      return FALLBACK_EXAMPLES;
    } catch (error) {
      console.error('Error refreshing examples:', error);
      return FALLBACK_EXAMPLES;
    }
  }

  /**
   * Get cache status information
   */
  getCacheStatus(): {
    hasCachedData: boolean;
    isValid: boolean;
    age: number | null;
    expiresIn: number | null;
  } {
    const cached = this.getCachedExamples();

    if (!cached) {
      return {
        hasCachedData: false,
        isValid: false,
        age: null,
        expiresIn: null,
      };
    }

    const age = Date.now() - cached.timestamp;
    const expiresIn = CACHE_DURATION - age;

    return {
      hasCachedData: true,
      isValid: this.isCacheValid(cached),
      age,
      expiresIn: expiresIn > 0 ? expiresIn : 0,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}

export const examplesService = new ExamplesService();
