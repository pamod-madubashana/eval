import { z } from "zod";

export const FeatureVectorSchema = z.object({
  experienceYears: z.number().nullable(),
  skills: z.array(z.string()).max(50),
  normalizedSkills: z.array(z.string()).max(50),
  location: z.string().nullable(),
  skillMatchScore: z.number().min(0).max(1),
  experienceMatchScore: z.number().min(0).max(1),
  locationMatchScore: z.number().min(0).max(1),
});

export const ScoringResultSchema = z.object({
  skillMatchScore: z.number().min(0).max(1),
  experienceMatchScore: z.number().min(0).max(1),
  locationMatchScore: z.number().min(0).max(1),
  finalScore: z.number().min(0).max(1),
});

export const AgentDecisionSchema = z.object({
  recommended: z.boolean(),
  score: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(2000),
  matchedSkills: z.array(z.string()).max(30).optional(),
  missingSkills: z.array(z.string()).max(30).optional(),
});

export const ParsedResumeSchema = z.object({
  text: z.string(),
  skills: z.array(z.string()),
  experienceYears: z.number().nullable(),
  education: z.array(z.string()),
  location: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  normalizedSkills: z.array(z.string()),
  keywords: z.array(z.string()),
});

export const LLMExtractedDataSchema = z.object({
  skills: z.array(z.string()).max(50).optional(),
  experienceYears: z.number().nullable().optional(),
  education: z.array(z.string()).max(10).optional(),
  location: z.string().nullable().optional(),
  certifications: z.array(z.string()).max(20).optional(),
  projects: z.array(z.string()).max(20).optional(),
});

export type FeatureVector = z.infer<typeof FeatureVectorSchema>;
export type ScoringResult = z.infer<typeof ScoringResultSchema>;
export type AgentDecision = z.infer<typeof AgentDecisionSchema>;
export type LLMExtractedData = z.infer<typeof LLMExtractedDataSchema>;

// ─── Request Validation Schemas ──────────────────────────────────

export const RecommendRequestSchema = z.object({
  useLLM: z.boolean().optional().default(false),
});

export const PresignRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
});

export const UploadRequestSchema = z.object({
  s3Key: z.string().min(1).max(500),
});

export const NoteRequestSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const StatusUpdateRequestSchema = z.object({
  status: z.enum(["SUBMITTED", "SHORTLISTED", "REJECTED"]),
});

export const OpeningIdParamSchema = z.object({
  openingId: z.string().uuid(),
});

export const ProfileIdParamSchema = z.object({
  profileId: z.string().regex(/^\d+$/, "Profile ID must be a number"),
});

export const NoteIdParamSchema = z.object({
  noteId: z.string().regex(/^\d+$/, "Note ID must be a number"),
});

export function validateWithRetry<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  maxRetries = 2
): { success: true; data: T } | { success: false; error: string } {
  let lastError = "";
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    lastError = result.error.errors.map((e) => e.message).join(", ");
    if (attempt < maxRetries) {
      console.warn(`[Schema] Validation attempt ${attempt + 1} failed: ${lastError}`);
    }
  }
  return { success: false, error: lastError };
}
