import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(100, 'Email must not exceed 100 characters')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .trim();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ===== Poll Schemas =====

export const pollTitleSchema = z
  .string()
  .min(3, 'Poll title must be at least 3 characters')
  .max(200, 'Poll title must not exceed 200 characters')
  .trim();

export const pollDescriptionSchema = z
  .string()
  .max(1000, 'Description must not exceed 1000 characters')
  .trim()
  .optional();

export const questionTextSchema = z
  .string()
  .min(3, 'Question must be at least 3 characters')
  .max(500, 'Question must not exceed 500 characters')
  .trim();

export const optionTextSchema = z
  .string()
  .min(1, 'Option cannot be empty')
  .max(200, 'Option must not exceed 200 characters')
  .trim();

export const questionSchema = z.object({
  type: z.enum(['multiple-choice', 'text', 'rating', 'yes-no', 'ranking']),
  question: questionTextSchema,
  description: z.string().max(500).optional(),
  options: z.array(optionTextSchema).min(2, 'At least 2 options required').max(10, 'Maximum 10 options allowed').optional(),
  required: z.boolean().default(true),
  minRating: z.number().int().min(1).max(10).optional(),
  maxRating: z.number().int().min(1).max(10).optional(),
});

export const pollSettingsSchema = z.object({
  allowAnonymous: z.boolean().default(true),
  showResults: z.enum(['after-submission', 'after-voting', 'never']).default('after-submission'),
  allowMultipleResponses: z.boolean().default(false),
  requireEmail: z.boolean().default(false),
});

export const createPollSchema = z.object({
  title: pollTitleSchema,
  description: pollDescriptionSchema,
  questions: z.array(questionSchema).min(1, 'At least one question is required').max(50, 'Maximum 50 questions allowed'),
  settings: pollSettingsSchema,
});

// ===== Response Schemas =====

export const participantNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z0-9\s'-_.]+$/, 'Name contains invalid characters')
  .trim()
  .optional();

export const participantEmailSchema = z
  .string()
  .email('Invalid email address')
  .max(100)
  .trim()
  .optional();

export const answerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  answer: z.union([
    z.string(),
    z.array(z.string()),
    z.number(),
    z.array(z.number()),
  ]),
});

export const submitResponseSchema = z.object({
  pollId: z.string().min(1, 'Poll ID is required'),
  answers: z.array(answerSchema).min(1, 'At least one answer is required'),
  participantName: participantNameSchema,
  participantEmail: participantEmailSchema,
});

// ===== AI Prompt Schemas =====

export const aiPromptSchema = z
  .string()
  .min(10, 'Prompt must be at least 10 characters')
  .max(1000, 'Prompt must not exceed 1000 characters')
  .trim();

export const aiRefinementSchema = z
  .string()
  .min(5, 'Refinement must be at least 5 characters')
  .max(500, 'Refinement must not exceed 500 characters')
  .trim();

// ===== Utility Functions =====

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().slice(0, 10000); // Max 10k characters for any input
}

/**
 * Safe parse with error handling
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    const errorMessage = result.error.issues[0]?.message || 'Validation failed';
    return { success: false, error: errorMessage };
  } catch {
    return { success: false, error: 'Validation error occurred' };
  }
}

// ===== Type Exports =====

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type CreatePollData = z.infer<typeof createPollSchema>;
export type SubmitResponseData = z.infer<typeof submitResponseSchema>;
export type QuestionData = z.infer<typeof questionSchema>;
export type PollSettingsData = z.infer<typeof pollSettingsSchema>;
