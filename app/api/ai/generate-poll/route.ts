import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GeneratePollRequest {
  prompt: string;
  currentPoll?: GeneratedPoll;
  isRefinement?: boolean;
}

interface GeneratedPoll {
  title: string;
  description: string;
  questions: Array<{
    type: string;
    question: string;
    description?: string;
    options?: string[];
    required?: boolean;
    minRating?: number;
    maxRating?: number;
    allowMultipleAnswers?: boolean;
    order?: number;
  }>;
  settings: {
    allowAnonymous: boolean;
    showResults: string;
    allowMultipleResponses: boolean;
    requireEmail: boolean;
  };
}

const SYSTEM_PROMPT = `You are an expert poll and survey designer AI assistant. Your task is to generate well-structured, engaging, and purposeful polls based on user requirements.

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

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePollRequest = await request.json();
    const { prompt, currentPoll, isRefinement } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 }
      );
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
    ];

    if (isRefinement && currentPoll) {
      messages.push({
        role: 'user',
        content: `Here is the current poll structure:\n\n${JSON.stringify(currentPoll, null, 2)}\n\nPlease refine it based on this feedback: ${prompt}`,
      });
    } else {
      messages.push({
        role: 'user',
        content: prompt,
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://streamx.appwrite.network',
        'X-Title': 'StreamX Poll Builder',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { 
          error: `OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content;

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'No content generated from AI' },
        { status: 500 }
      );
    }

    // Parse and clean the response
    let cleanContent = generatedContent.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    let parsedPoll;
    try {
      parsedPoll = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse AI response:', cleanContent);
      return NextResponse.json(
        { error: 'Failed to parse AI-generated poll. Please try again.' },
        { status: 500 }
      );
    }

    // Basic validation
    if (!parsedPoll.title || !Array.isArray(parsedPoll.questions) || parsedPoll.questions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid poll structure generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      poll: parsedPoll,
      usage: data.usage,
    });

  } catch (error) {
    console.error('Error in AI poll generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
      );
  }
}
