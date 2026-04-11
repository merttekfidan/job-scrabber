import { z, ZodSchema } from 'zod';

export const SaveApplicationSchema = z.object({
  jobTitle: z.string().max(500).optional().default('Unknown Position'),
  company: z.string().max(255).optional().default('Unknown Company'),
  jobUrl: z.string().url('Invalid job URL').max(2000).optional().nullable(),
  applicationDate: z.string().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  workMode: z.string().max(50).optional().nullable(),
  salary: z.string().max(200).optional().nullable(),
  companyUrl: z.string().url().max(2000).optional().nullable().or(z.literal('')),
  status: z.string().max(50).optional().default('Applied'),
  sourceUrl: z.string().url().max(2000).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  interviewDate: z.string().optional().nullable(),
  jobData: z.record(z.string(), z.any()).optional().default({}),
  companyData: z.record(z.string(), z.any()).optional().default({}),
});

export const UpdateDetailsSchema = z.object({
  id: z.number().int().positive(),
  updates: z.record(z.string(), z.unknown()),
});

export const UpdateStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.string().max(50),
});

// ─── Onboarding Schemas ──────────────────────────────────────

export const OnboardingUploadCvSchema = z.object({
  filename: z.string().min(1),
  rawText: z.string().min(10, 'CV content too short'),
});

export const OnboardingAnswersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      question: z.string(),
      answer: z.string().min(1),
    })
  ),
});

// ─── Job Scraping Schemas ───────────────────────────────────

export const JobScrapeSchema = z.object({
  url: z.string().url('Invalid URL').max(2000),
});

export const JobResearchSchema = z.object({
  companyName: z.string().min(1).max(255),
  companyUrl: z.string().url().max(2000).optional().nullable(),
  jobData: z.record(z.string(), z.any()).optional().default({}),
});

// ─── Report Schemas ─────────────────────────────────────────

export const GenerateReportSchema = z.object({
  applicationId: z.number().int().positive(),
});

// ─── Mock Interview Schemas (kept from Phase 8) ─────────────

export const MockStartSchema = z.object({
  applicationId: z.number().int().positive(),
  roundType: z.enum(['Screening', 'Technical', 'Behavioral', 'Final']),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
});

export const MockSubmitAnswerSchema = z.object({
  sessionId: z.number().int().positive(),
  questionIndex: z.number().int().min(0),
  userAnswer: z.string().min(1).max(10000),
});

export const MockEndSessionSchema = z.object({
  sessionId: z.number().int().positive(),
});

type ValidateSuccess<T> = { success: true; data: T };
type ValidateFailure = { success: false; error: string; status: 400 };

export const validateBody = <T>(schema: ZodSchema<T>, body: unknown): ValidateSuccess<T> | ValidateFailure => {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return {
      success: false,
      error: `Validation failed: ${errors.join(', ')}`,
      status: 400,
    };
  }
  return { success: true, data: result.data };
};
