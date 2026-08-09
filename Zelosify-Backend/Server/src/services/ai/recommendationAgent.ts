import prisma from "../../config/prisma/prisma.js";
import { parseResume, ParsedResume } from "./parsing/resumeParser.js";
import { createLLMProvider } from "./llm/llmFactory.js";

interface RecommendationInput {
  profileId: number;
  openingId: string;
  useLLM?: boolean;
}

interface RecommendationResult {
  profileId: number;
  score: number;
  reason: string;
  latencyMs: number;
  parsedData?: ParsedResume;
}

interface OpeningData {
  id: string;
  title: string;
  description: string;
  location: string;
  contractType: string;
  experienceMin: number;
  experienceMax: number;
}

interface ProfileData {
  id: number;
  s3Key: string;
  submittedAt: Date;
}

/**
 * Deterministic scoring using real parsed resume data
 * Formula: 0.5*skill + 0.3*experience + 0.2*location
 */
function calculateDeterministicScore(
  opening: OpeningData,
  profile: ProfileData,
  parsedResume: ParsedResume
): { score: number; reason: string } {
  // Skill match: compare parsed skills with job description
  const jobSkills = extractJobSkills(opening.description + " " + opening.title);
  const matchedSkills = parsedResume.skills.filter((skill) =>
    jobSkills.some(
      (js) =>
        js.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(js.toLowerCase())
    )
  );
  const skillScore =
    jobSkills.length > 0
      ? Math.min(1, matchedSkills.length / Math.max(jobSkills.length, 1))
      : 0.5;

  // Experience match
  const candidateExp = parsedResume.experienceYears;
  let experienceScore = 0.5; // Default if unknown
  if (candidateExp !== null) {
    if (candidateExp < opening.experienceMin) {
      experienceScore = Math.max(0, 1 - (opening.experienceMin - candidateExp) * 0.2);
    } else if (candidateExp > opening.experienceMax) {
      experienceScore = 0.8; // Overqualified but still good
    } else {
      experienceScore = 1.0; // Perfect match
    }
  }

  // Location match
  let locationScore = 0.5;
  const openingLoc = opening.location.toLowerCase();
  const candidateLoc = parsedResume.location?.toLowerCase() || "";

  if (openingLoc.includes("remote")) {
    locationScore = 1.0;
  } else if (candidateLoc && openingLoc.includes(candidateLoc)) {
    locationScore = 1.0;
  } else if (candidateLoc) {
    locationScore = 0.4; // Different location
  }

  // Weighted score
  const score = 0.5 * skillScore + 0.3 * experienceScore + 0.2 * locationScore;

  const reason = `Skills: ${(skillScore * 100).toFixed(1)}% (${matchedSkills.length}/${jobSkills.length} matched), Experience: ${(experienceScore * 100).toFixed(1)}% (${candidateExp || "unknown"} years vs ${opening.experienceMin}-${opening.experienceMax} required), Location: ${(locationScore * 100).toFixed(1)}%`;

  return { score, reason };
}

/**
 * Extract skills from job description text
 */
function extractJobSkills(text: string): string[] {
  const skillPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Ruby|Go|Rust|PHP|Swift|Kotlin)\b/gi,
    /\b(React|Angular|Vue\.?js|Next\.?js|Node\.?js|Express|Django|Flask|Spring)\b/gi,
    /\b(PostgreSQL|MySQL|MongoDB|Redis|Docker|Kubernetes|AWS|Azure|GCP)\b/gi,
    /\b(Machine Learning|Deep Learning|NLP|TensorFlow|PyTorch)\b/gi,
    /\b(Git|CI\/CD|Agile|Scrum)\b/gi,
  ];

  const skills = new Set<string>();
  for (const pattern of skillPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        skills.add(match.trim());
      }
    }
  }
  return Array.from(skills);
}

/**
 * LLM-powered scoring with detailed reasoning
 */
async function calculateLLMScore(
  opening: OpeningData,
  profile: ProfileData,
  parsedResume: ParsedResume
): Promise<{ score: number; reason: string; confidence: number }> {
  const llm = await createLLMProvider();

  const prompt = `You are an AI hiring assistant. Analyze this candidate profile against the job opening and provide a matching score.

JOB OPENING:
Title: ${opening.title}
Description: ${opening.description}
Location: ${opening.location}
Contract Type: ${opening.contractType}
Experience Required: ${opening.experienceMin}-${opening.experienceMax} years

CANDIDATE PROFILE:
Skills Found: ${parsedResume.skills.join(", ") || "Not specified"}
Experience: ${parsedResume.experienceYears || "Not specified"} years
Education: ${parsedResume.education.join(", ") || "Not specified"}
Location: ${parsedResume.location || "Not specified"}

Provide your analysis as JSON only (no other text):
{
  "score": <number between 0 and 1>,
  "reason": "<brief explanation of the match>",
  "confidence": <number between 0 and 1 indicating your confidence>,
  "matchedSkills": ["<skill1>", "<skill2>"],
  "missingSkills": ["<skill1>", "<skill2>"]
}`;

  const response = await llm.analyze(prompt);

  // Parse JSON from response
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(1, Math.max(0, result.score || 0)),
        reason: result.reason || "No reason provided",
        confidence: Math.min(1, Math.max(0, result.confidence || 0.7)),
      };
    }
  } catch (e) {
    console.error("Failed to parse LLM response:", e);
  }

  // Fallback to deterministic scoring
  const { score, reason } = calculateDeterministicScore(
    opening,
    profile,
    parsedResume
  );
  return { score, reason, confidence: 0.6 };
}

/**
 * AI Recommendation Agent
 * Orchestrates the recommendation process for a single profile
 */
export async function runRecommendationAgent(
  input: RecommendationInput
): Promise<RecommendationResult> {
  const startTime = Date.now();

  try {
    // Fetch opening details
    const opening = await prisma.opening.findUnique({
      where: { id: input.openingId },
    });

    if (!opening) {
      throw new Error(`Opening ${input.openingId} not found`);
    }

    // Fetch profile details
    const profile = await prisma.hiringProfile.findUnique({
      where: { id: input.profileId },
    });

    if (!profile) {
      throw new Error(`Profile ${input.profileId} not found`);
    }

    // Parse resume from S3
    console.log(`[AI] Parsing resume for profile ${profile.id}...`);
    const parsedResume = await parseResume(profile.s3Key);
    console.log(
      `[AI] Parsed resume: ${parsedResume.skills.length} skills, ${parsedResume.experienceYears || "unknown"} years experience`
    );

    // Calculate score (LLM or deterministic)
    let score: number;
    let reason: string;
    let confidence: number;
    let version: string;

    if (input.useLLM && (process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY)) {
      console.log(`[AI] Using LLM scoring...`);
      const llmResult = await calculateLLMScore(opening, profile, parsedResume);
      score = llmResult.score;
      reason = llmResult.reason;
      confidence = llmResult.confidence;
      version = `llm-${process.env.LLM_PROVIDER || "gemini"}-v1`;
    } else {
      console.log(`[AI] Using deterministic scoring...`);
      const detResult = calculateDeterministicScore(opening, profile, parsedResume);
      score = detResult.score;
      reason = detResult.reason;
      confidence = 0.75;
      version = "deterministic-v2";
    }

    const latencyMs = Date.now() - startTime;

    // Store recommendation
    await prisma.hiringProfile.update({
      where: { id: input.profileId },
      data: {
        recommended: true,
        recommendationScore: score,
        recommendationReason: reason,
        recommendationLatencyMs: latencyMs,
        recommendationVersion: version,
        recommendationConfidence: confidence,
        recommendedAt: new Date(),
      },
    });

    return {
      profileId: input.profileId,
      score,
      reason,
      latencyMs,
      parsedData: parsedResume,
    };
  } catch (error) {
    console.error("Recommendation agent error:", error);
    throw error;
  }
}

/**
 * Batch recommendation agent
 * Process multiple profiles with performance tracking
 */
export async function runBatchRecommendations(
  openingId: string,
  useLLM: boolean = false
): Promise<{
  results: RecommendationResult[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
  };
}> {
  // Fetch all submitted profiles for this opening
  const profiles = await prisma.hiringProfile.findMany({
    where: {
      openingId,
      status: "SUBMITTED",
      isDeleted: false,
      recommended: null,
    },
  });

  const results: RecommendationResult[] = [];
  const latencies: number[] = [];

  for (const profile of profiles) {
    try {
      const result = await runRecommendationAgent({
        profileId: profile.id,
        openingId,
        useLLM,
      });
      results.push(result);
      latencies.push(result.latencyMs);
    } catch (error) {
      console.error(`Failed to process profile ${profile.id}:`, error);
      results.push({
        profileId: profile.id,
        score: 0,
        reason: "Processing failed",
        latencyMs: 0,
      });
    }
  }

  // Calculate stats
  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const p95Index = Math.floor(sortedLatencies.length * 0.95);

  const stats = {
    total: profiles.length,
    successful: results.filter((r) => r.score > 0).length,
    failed: results.filter((r) => r.score === 0).length,
    avgLatencyMs:
      latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0,
    p95LatencyMs:
      sortedLatencies.length > 0 ? sortedLatencies[p95Index] || 0 : 0,
  };

  return { results, stats };
}
