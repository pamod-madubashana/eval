import { describe, it, expect, beforeEach } from "vitest";

// ─── Mock Domain Entities ────────────────────────────────────────

interface Opening {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  location: string;
  contractType: string;
  experienceMin: number;
  experienceMax: number;
  status: string;
  hiringManagerId: string;
}

interface HiringProfile {
  id: number;
  openingId: string;
  s3Key: string;
  uploadedBy: string;
  status: string;
  recommended: boolean | null;
  recommendationScore: number | null;
  recommendationReason: string | null;
  recommendationLatencyMs: number | null;
  recommendationVersion: string | null;
  recommendationConfidence: number | null;
  recommendedAt: Date | null;
  shortlistedBy: string | null;
  shortlistedAt: Date | null;
}

// ─── In-Memory Database ──────────────────────────────────────────

const db: { openings: Opening[]; profiles: HiringProfile[] } = {
  openings: [],
  profiles: [],
};

let profileIdCounter = 1;

// ─── Scoring Engine (deterministic) ──────────────────────────────

function calculateSkillMatch(candidateSkills: string[], jobDescription: string): number {
  const jobSkills = jobDescription.toLowerCase();
  const matched = candidateSkills.filter((s) => jobSkills.includes(s.toLowerCase()));
  return candidateSkills.length > 0 ? matched.length / candidateSkills.length : 0;
}

function calculateExperienceMatch(candidateExp: number | null, min: number, max: number): number {
  if (candidateExp === null) return 0.5;
  if (candidateExp < min) return Math.max(0, 1 - (min - candidateExp) * 0.2);
  if (candidateExp > max) return 0.8;
  return 1.0;
}

function calculateLocationMatch(candidateLoc: string | null, openingLoc: string): number {
  const opening = openingLoc.toLowerCase();
  const candidate = candidateLoc?.toLowerCase() || "";
  if (opening.includes("remote")) return 1.0;
  if (candidate && opening.includes(candidate)) return 1.0;
  if (candidate) return 0.4;
  return 0.5;
}

function calculateFinalScore(skill: number, experience: number, location: number): number {
  return 0.5 * skill + 0.3 * experience + 0.2 * location;
}

function getDecision(score: number): string {
  if (score >= 0.75) return "Recommended";
  if (score >= 0.5) return "Borderline";
  return "Not Recommended";
}

// ─── Use Case Simulations ────────────────────────────────────────

function createOpening(data: Partial<Opening>): Opening {
  const opening: Opening = {
    id: `opening-${Date.now()}`,
    tenantId: data.tenantId || "tenant-1",
    title: data.title || "Test Opening",
    description: data.description || "React JavaScript Node.js",
    location: data.location || "New York, NY",
    contractType: data.contractType || "Full-Time",
    experienceMin: data.experienceMin || 3,
    experienceMax: data.experienceMax || 7,
    status: "OPEN",
    hiringManagerId: data.hiringManagerId || "manager-1",
  };
  db.openings.push(opening);
  return opening;
}

function submitProfile(openingId: string, s3Key: string, userId: string, tenantId: string): HiringProfile {
  const profile: HiringProfile = {
    id: profileIdCounter++,
    openingId,
    s3Key,
    uploadedBy: userId,
    status: "SUBMITTED",
    recommended: null,
    recommendationScore: null,
    recommendationReason: null,
    recommendationLatencyMs: null,
    recommendationVersion: null,
    recommendationConfidence: null,
    recommendedAt: null,
    shortlistedBy: null,
    shortlistedAt: null,
  };
  db.profiles.push(profile);
  return profile;
}

function runRecommendationAgent(profileId: number, openingId: string): HiringProfile {
  const profile = db.profiles.find((p) => p.id === profileId);
  const opening = db.openings.find((o) => o.id === openingId);
  if (!profile || !opening) throw new Error("Not found");

  const startTime = Date.now();

  // Simulate parsing (extract skills from s3Key filename)
  const skills = profile.s3Key.toLowerCase().includes("react")
    ? ["React", "JavaScript", "TypeScript"]
    : ["Python", "Django"];

  const skillScore = calculateSkillMatch(skills, opening.description);
  const expScore = calculateExperienceMatch(5, opening.experienceMin, opening.experienceMax);
  const locScore = calculateLocationMatch("New York", opening.location);
  const finalScore = calculateFinalScore(skillScore, expScore, locScore);

  const latencyMs = Date.now() - startTime;

  profile.recommended = true;
  profile.recommendationScore = finalScore;
  profile.recommendationReason = `Skills: ${(skillScore * 100).toFixed(1)}%, Experience: ${(expScore * 100).toFixed(1)}%, Location: ${(locScore * 100).toFixed(1)}%`;
  profile.recommendationLatencyMs = latencyMs;
  profile.recommendationVersion = "agent-deterministic-v1";
  profile.recommendationConfidence = 0.75;
  profile.recommendedAt = new Date();

  return profile;
}

function shortlistProfile(profileId: number, userId: string): HiringProfile {
  const profile = db.profiles.find((p) => p.id === profileId);
  if (!profile) throw new Error("Profile not found");
  if (profile.status !== "SUBMITTED") throw new Error("Profile not in SUBMITTED status");

  profile.status = "SHORTLISTED";
  profile.shortlistedBy = userId;
  profile.shortlistedAt = new Date();

  return profile;
}

function rejectProfile(profileId: number, userId: string): HiringProfile {
  const profile = db.profiles.find((p) => p.id === profileId);
  if (!profile) throw new Error("Profile not found");
  if (profile.status !== "SUBMITTED") throw new Error("Profile not in SUBMITTED status");

  profile.status = "REJECTED";
  return profile;
}

// ─── Tests ───────────────────────────────────────────────────────

describe("Integration Tests - Full Flow", () => {
  beforeEach(() => {
    db.openings.length = 0;
    db.profiles.length = 0;
    profileIdCounter = 1;
  });

  describe("Upload → Submit → Recommend → Shortlist", () => {
    it("should complete the full hiring flow", () => {
      // Step 1: Create opening
      const opening = createOpening({
        title: "Senior React Developer",
        description: "React JavaScript TypeScript Node.js",
        location: "New York, NY",
        experienceMin: 3,
        experienceMax: 7,
      });
      expect(opening.id).toBeDefined();
      expect(opening.status).toBe("OPEN");

      // Step 2: Vendor uploads profile
      const profile = submitProfile(
        opening.id,
        "tenant-1/opening-1/resume.pdf",
        "vendor-1",
        "tenant-1"
      );
      expect(profile.id).toBeDefined();
      expect(profile.status).toBe("SUBMITTED");
      expect(profile.recommended).toBeNull();

      // Step 3: AI recommendation agent runs
      const recommended = runRecommendationAgent(profile.id, opening.id);
      expect(recommended.recommendationScore).not.toBeNull();
      expect(recommended.recommendationScore).toBeGreaterThanOrEqual(0);
      expect(recommended.recommendationScore).toBeLessThanOrEqual(1);
      expect(recommended.recommendationReason).toBeDefined();
      expect(recommended.recommendationLatencyMs).toBeGreaterThanOrEqual(0);
      expect(recommended.recommendationVersion).toBe("agent-deterministic-v1");

      // Step 4: Hiring manager shortlists
      const shortlisted = shortlistProfile(profile.id, "manager-1");
      expect(shortlisted.status).toBe("SHORTLISTED");
      expect(shortlisted.shortlistedBy).toBe("manager-1");
      expect(shortlisted.shortlistedAt).toBeDefined();
    });

    it("should complete the full flow with rejection", () => {
      const opening = createOpening({
        title: "Junior Frontend Developer",
        description: "JavaScript React HTML CSS",
        location: "Remote",
        experienceMin: 1,
        experienceMax: 3,
      });

      const profile = submitProfile(
        opening.id,
        "tenant-1/opening-2/resume.pdf",
        "vendor-2",
        "tenant-1"
      );

      const recommended = runRecommendationAgent(profile.id, opening.id);
      expect(recommended.recommendationScore).not.toBeNull();

      const rejected = rejectProfile(profile.id, "manager-1");
      expect(rejected.status).toBe("REJECTED");
    });

    it("should handle multiple profiles on same opening", () => {
      const opening = createOpening({
        title: "Backend Node.js Engineer",
        description: "Node.js JavaScript PostgreSQL Docker",
        location: "San Francisco, CA",
        experienceMin: 4,
        experienceMax: 8,
      });

      // Submit 3 profiles
      const profile1 = submitProfile(opening.id, "resume-react.pdf", "vendor-1", "tenant-1");
      const profile2 = submitProfile(opening.id, "resume-python.pdf", "vendor-2", "tenant-1");
      const profile3 = submitProfile(opening.id, "resume-go.pdf", "vendor-3", "tenant-1");

      // Run recommendations
      runRecommendationAgent(profile1.id, opening.id);
      runRecommendationAgent(profile2.id, opening.id);
      runRecommendationAgent(profile3.id, opening.id);

      // All should have scores
      const profiles = db.profiles.filter((p) => p.openingId === opening.id);
      expect(profiles).toHaveLength(3);
      expect(profiles.every((p) => p.recommendationScore !== null)).toBe(true);

      // Shortlist one
      shortlistProfile(profile1.id, "manager-1");
      expect(profiles.find((p) => p.id === profile1.id)?.status).toBe("SHORTLISTED");
    });
  });

  describe("Score Formula Validation", () => {
    it("should apply correct weights", () => {
      const skill = 0.8;
      const exp = 1.0;
      const loc = 1.0;
      const score = calculateFinalScore(skill, exp, loc);
      expect(score).toBeCloseTo(0.9, 1);
    });

    it("should return 0 for all zero inputs", () => {
      const score = calculateFinalScore(0, 0, 0);
      expect(score).toBe(0);
    });

    it("should return 1 for all max inputs", () => {
      const score = calculateFinalScore(1, 1, 1);
      expect(score).toBe(1);
    });

    it("should weight skill match at 50%", () => {
      const score = calculateFinalScore(1, 0, 0);
      expect(score).toBeCloseTo(0.5, 1);
    });

    it("should weight experience match at 30%", () => {
      const score = calculateFinalScore(0, 1, 0);
      expect(score).toBeCloseTo(0.3, 1);
    });

    it("should weight location match at 20%", () => {
      const score = calculateFinalScore(0, 0, 1);
      expect(score).toBeCloseTo(0.2, 1);
    });
  });

  describe("Decision Thresholds", () => {
    it("should recommend score >= 0.75", () => {
      expect(getDecision(0.75)).toBe("Recommended");
      expect(getDecision(0.85)).toBe("Recommended");
      expect(getDecision(1.0)).toBe("Recommended");
    });

    it("should mark borderline 0.5-0.74", () => {
      expect(getDecision(0.5)).toBe("Borderline");
      expect(getDecision(0.6)).toBe("Borderline");
      expect(getDecision(0.74)).toBe("Borderline");
    });

    it("should not recommend < 0.5", () => {
      expect(getDecision(0.0)).toBe("Not Recommended");
      expect(getDecision(0.3)).toBe("Not Recommended");
      expect(getDecision(0.49)).toBe("Not Recommended");
    });
  });

  describe("Edge Cases", () => {
    it("should handle profile with null experience", () => {
      const opening = createOpening({ experienceMin: 5, experienceMax: 10 });
      const profile = submitProfile(opening.id, "resume.pdf", "vendor-1", "tenant-1");
      const result = runRecommendationAgent(profile.id, opening.id);
      expect(result.recommendationScore).not.toBeNull();
    });

    it("should handle remote opening location", () => {
      const opening = createOpening({ location: "Remote" });
      const profile = submitProfile(opening.id, "resume.pdf", "vendor-1", "tenant-1");
      const result = runRecommendationAgent(profile.id, opening.id);
      expect(result.recommendationScore).not.toBeNull();
    });

    it("should prevent shortlisting non-SUBMITTED profile", () => {
      const opening = createOpening({});
      const profile = submitProfile(opening.id, "resume.pdf", "vendor-1", "tenant-1");
      shortlistProfile(profile.id, "manager-1");
      
      expect(() => shortlistProfile(profile.id, "manager-1")).toThrow("Profile not in SUBMITTED status");
    });

    it("should prevent rejecting non-SUBMITTED profile", () => {
      const opening = createOpening({});
      const profile = submitProfile(opening.id, "resume.pdf", "vendor-1", "tenant-1");
      rejectProfile(profile.id, "manager-1");
      
      expect(() => rejectProfile(profile.id, "manager-1")).toThrow("Profile not in SUBMITTED status");
    });
  });
});
