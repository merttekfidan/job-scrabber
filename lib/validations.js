import { z } from 'zod';

// ─── Application Schemas ───────────────────────────────────────

export const SaveApplicationSchema = z.object({
    jobTitle: z.string().min(1, 'Job title is required').max(500),
    company: z.string().min(1, 'Company is required').max(500),
    jobUrl: z.string().url('Invalid job URL').max(2000),
    applicationDate: z.string().min(1, 'Application date is required'),
    location: z.string().max(500).optional().nullable(),
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
        questionsToAsk: z.array(z.string()).optional().default([]),
        potentialRedFlags: z.array(z.string()).optional().default([]),
        techStackToStudy: z.array(z.string()).optional().default([]),
    }).optional().nullable(),
    metadata: z.object({
        jobBoardSource: z.string().optional(),
    }).optional().nullable(),
});

export const UpdateStatusSchema = z.object({
    id: z.coerce.number().int().positive('Valid application ID required'),
    status: z.string().min(1).max(50),
});

export const UpdateDetailsSchema = z.object({
    id: z.coerce.number().int().positive('Valid application ID required'),
    updates: z.record(z.any()).refine(
        (obj) => Object.keys(obj).length > 0,
        'At least one field to update is required'
    ),
});

export const CompanyInsightsSchema = z.object({
    applicationId: z.coerce.number().int().positive('Valid application ID required'),
});

export const AnalyzeJobSchema = z.object({
    applicationId: z.coerce.number().int().positive('Valid application ID required'),
});

export const SendOTPSchema = z.object({
    email: z.string().email('Valid email is required').max(255),
});

export const DeleteApplicationSchema = z.object({
    id: z.coerce.number().int().positive('Valid application ID required'),
});

// ─── Extension Process Schema ──────────────────────────────────

export const ExtensionProcessSchema = z.object({
    url: z.string().url('Valid URL required').max(2000),
    pageContent: z.string().min(100, 'Page content too short').max(500000),
    jobBoard: z.string().max(100).optional().default('Unknown'),
    pageTitle: z.string().max(1000).optional().default(''),
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
