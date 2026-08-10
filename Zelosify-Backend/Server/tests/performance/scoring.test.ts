import { describe, it, expect } from "vitest";

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

interface RecommendationResult {
  profileId: number;
  score: number;
  latencyMs: number;
}

function runRecommendationBatch(
  profiles: Array<{ id: number; skills: string[]; experience: number | null; location: string | null }>,
  opening: { description: string; experienceMin: number; experienceMax: number; location: string }
): RecommendationResult[] {
  const results: RecommendationResult[] = [];

  for (const profile of profiles) {
    const start = performance.now();

    const skillScore = calculateSkillMatch(profile.skills, opening.description);
    const expScore = calculateExperienceMatch(profile.experience, opening.experienceMin, opening.experienceMax);
    const locScore = calculateLocationMatch(profile.location, opening.location);
    const finalScore = calculateFinalScore(skillScore, expScore, locScore);

    const latencyMs = performance.now() - start;

    results.push({
      profileId: profile.id,
      score: finalScore,
      latencyMs,
    });
  }

  return results;
}

// ─── Test Data Generator ─────────────────────────────────────────

const SKILL_POOLS = [
  ["React", "JavaScript", "TypeScript", "CSS", "HTML"],
  ["Node.js", "Express", "TypeScript", "PostgreSQL"],
  ["Python", "Django", "Flask", "PostgreSQL"],
  ["Java", "Spring Boot", "Hibernate", "MySQL"],
  ["Go", "gRPC", "PostgreSQL", "Docker"],
  ["Rust", "Tokio", "PostgreSQL", "Redis"],
  ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  ["Vue.js", "Nuxt.js", "TypeScript", "Vuex"],
  ["Angular", "TypeScript", "RxJS", "NgRx"],
  ["C#", ".NET", "Entity Framework", "SQL Server"],
];

const LOCATIONS = [
  "New York, NY",
  "San Francisco, CA",
  "Austin, TX",
  "Seattle, WA",
  "Remote",
  "London, UK",
  "Berlin, Germany",
  "Toronto, Canada",
  "Bangalore, India",
  "Sydney, Australia",
];

function generateProfiles(count: number): Array<{ id: number; skills: string[]; experience: number | null; location: string | null }> {
  const profiles = [];
  for (let i = 0; i < count; i++) {
    const skills = SKILL_POOLS[i % SKILL_POOLS.length];
    const experience = Math.random() < 0.1 ? null : Math.floor(Math.random() * 15) + 1;
    const location = Math.random() < 0.1 ? null : LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    profiles.push({ id: i + 1, skills, experience, location });
  }
  return profiles;
}

// ─── Performance Tests ───────────────────────────────────────────

describe("Performance Tests - 100 Profiles", () => {
  const opening = {
    description: "React JavaScript TypeScript Node.js PostgreSQL",
    experienceMin: 3,
    experienceMax: 7,
    location: "New York, NY",
  };

  it("should process 100 profiles in under 500ms", () => {
    const profiles = generateProfiles(100);
    const start = performance.now();
    const results = runRecommendationBatch(profiles, opening);
    const totalMs = performance.now() - start;

    expect(results).toHaveLength(100);
    expect(totalMs).toBeLessThan(500);
  });

  it("should produce scores between 0 and 1 for all profiles", () => {
    const profiles = generateProfiles(100);
    const results = runRecommendationBatch(profiles, opening);

    results.forEach((r) => {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    });
  });

  it("should produce valid distribution (not all same score)", () => {
    const profiles = generateProfiles(100);
    const results = runRecommendationBatch(profiles, opening);

    const scores = results.map((r) => r.score);
    const uniqueScores = new Set(scores.map((s) => s.toFixed(4)));
    expect(uniqueScores.size).toBeGreaterThan(1);
  });

  it("should report per-profile latency < 5ms", () => {
    const profiles = generateProfiles(100);
    const results = runRecommendationBatch(profiles, opening);

    results.forEach((r) => {
      expect(r.latencyMs).toBeLessThan(5);
    });
  });

  it("should complete 1000 profiles in under 5 seconds", () => {
    const profiles = generateProfiles(1000);
    const start = performance.now();
    const results = runRecommendationBatch(profiles, opening);
    const totalMs = performance.now() - start;

    expect(results).toHaveLength(1000);
    expect(totalMs).toBeLessThan(5000);
  });

  it("should have consistent latency across batches", () => {
    const profiles = generateProfiles(100);

    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      runRecommendationBatch(profiles, opening);
      times.push(performance.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const maxDeviation = Math.max(...times.map((t) => Math.abs(t - avg)));
    expect(maxDeviation).toBeLessThan(avg * 10);
  });
});
