import { z } from 'zod';

// ─── Application Schemas ───────────────────────────────────────

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
    keyResponsibilities: z.array(z.string()).optional().default([]),
    requiredSkills: z.array(z.string()).optional().default([]),
    preferredSkills: z.array(z.string()).optional().default([]),
    companyDescription: z.string().max(50000).optional().nullable(),
    originalContent: z.string().max(200000).optional().nullable(),
    formattedContent: z.string().max(200000).optional().nullable(),
    negativeSignals: z.array(z.string()).optional().default([]),
    roleSummary: z.string().max(5000).optional().nullable(),
    interviewStages: z.array(z.any()).optional().default([]),
    hiringManager: z.any().optional().nullable(),
    companyInfo: z.any().optional().nullable(),
    interviewPrepNotes: z.object({
        keyTalkingPoints: z.array(z.any()).optional().default([]),
        questionsToAsk: z.array(z.any()).optional().default([]),
        potentialRedFlags: z.array(z.any()).optional().default([]),
        redFlags: z.array(z.any()).optional().default([]),
        likelyInterviewQuestions: z.array(z.any()).optional().default([]),
        techStackToStudy: z.array(z.any()).optional().default([]),
    }).optional().default({}),
    metadata: z.record(z.any()).optional().default({}),
});

export const UpdateDetailsSchema = z.object({
    id: z.number().int().positive(),
    updates: z.record(z.string(), z.unknown()),
});

// ─── Extension Schemas ─────────────────────────────────────────

export const ExtensionProcessSchema = z.object({
    url: z.string().url('Invalid URL'),
    pageContent: z.string().min(10, 'Page content too short').max(200000, 'Page content too large'),
    jobBoard: z.string().optional().default('Unknown'),
    pageTitle: z.string().optional().default(''),
});

// ─── AI Generation Schemas ─────────────────────────────────────

export const AIInsightsSchema = z.object({
    applicationId: z.number().int().positive(),
    action: z.enum(['analyze-company', 'generate-questions', 'compare-skills', 'overall-strategy']),
});

// ─── Auth Schemas ──────────────────────────────────────────────

export const SendOTPSchema = z.object({
    email: z.string().email('Invalid email address'),
});

// ─── Dashboard Action Schemas ──────────────────────────────────

export const UpdateStatusSchema = z.object({
    id: z.number().int().positive(),
    status: z.string().max(50),
});

export const AnalyzeJobSchema = z.object({
    applicationId: z.number().int().positive(),
});

export const CompanyInsightsSchema = z.object({
    applicationId: z.number().int().positive(),
});

// ─── Helper ────────────────────────────────────────────────────

/**
 * Validate request body against a Zod schema.
 * Returns { success: true, data } or { success: false, error, status: 400 }
 */
export function validateBody(schema, body) {
    const result = schema.safeParse(body);
    if (!result.success) {
        const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
        return {
            success: false,
            error: `Validation failed: ${errors.join(', ')}`,
            status: 400,
        };
    }
    return { success: true, data: result.data };
}
