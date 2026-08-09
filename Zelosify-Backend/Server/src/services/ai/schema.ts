import { z } from "zod";

export const FeatureVectorSchema = z.object({
  experienceYears: z.number().nullable(),
  skills: z.array(z.string()),
  normalizedSkills: z.array(z.string()),
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
  reason: z.string().min(1),
  matchedSkills: z.array(z.string()).optional(),
  missingSkills: z.array(z.string()).optional(),
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

export type FeatureVector = z.infer<typeof FeatureVectorSchema>;
export type ScoringResult = z.infer<typeof ScoringResultSchema>;
export type AgentDecision = z.infer<typeof AgentDecisionSchema>;

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
