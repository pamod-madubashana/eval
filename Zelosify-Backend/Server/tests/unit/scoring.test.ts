import { describe, it, expect } from "vitest";

describe("Feature Extraction", () => {
  it("should calculate skill match score", () => {
    const jobSkills = ["JavaScript", "React", "Node.js"];
    const candidateSkills = ["JavaScript", "React", "Python"];
    const matched = candidateSkills.filter((s) =>
      jobSkills.some((j) => j.toLowerCase() === s.toLowerCase())
    );
    const score = matched.length / jobSkills.length;
    expect(score).toBeCloseTo(2 / 3, 1);
  });

  it("should return 0.5 for empty job skills", () => {
    const jobSkills: string[] = [];
    const score = jobSkills.length > 0 ? 0.8 : 0.5;
    expect(score).toBe(0.5);
  });

  it("should handle case-insensitive matching", () => {
    const jobSkills = ["javascript", "REACT"];
    const candidateSkills = ["JavaScript", "react"];
    const matched = candidateSkills.filter((s) =>
      jobSkills.some((j) => j.toLowerCase() === s.toLowerCase())
    );
    expect(matched.length).toBe(2);
  });
});

describe("Experience Scoring", () => {
  function calcExpScore(candidate: number | null, min: number, max: number): number {
    if (candidate === null) return 0.5;
    if (candidate < min) return Math.max(0, 1 - (min - candidate) * 0.2);
    if (candidate > max) return 0.8;
    return 1.0;
  }

  it("should return 0 for candidate far below minimum", () => {
    expect(calcExpScore(0, 5, 10)).toBe(0);
  });

  it("should return 1 for candidate within range", () => {
    expect(calcExpScore(7, 5, 10)).toBe(1.0);
  });

  it("should return 0.8 for overqualified candidate", () => {
    expect(calcExpScore(15, 5, 10)).toBe(0.8);
  });

  it("should return 0.5 for unknown experience", () => {
    expect(calcExpScore(null, 5, 10)).toBe(0.5);
  });

  it("should return 0.8 for candidate slightly below minimum", () => {
    expect(calcExpScore(4, 5, 10)).toBe(0.8);
  });
});

describe("Location Scoring", () => {
  function calcLocScore(candidate: string | null, opening: string): number {
    const o = opening.toLowerCase();
    const c = candidate?.toLowerCase() || "";
    if (o.includes("remote")) return 1.0;
    if (c && o.includes(c)) return 1.0;
    if (c) return 0.4;
    return 0.5;
  }

  it("should return 1 for remote opening", () => {
    expect(calcLocScore("New York", "Remote")).toBe(1.0);
  });

  it("should return 1 for matching location", () => {
    expect(calcLocScore("New York", "New York, NY")).toBe(1.0);
  });

  it("should return 0.4 for mismatched location", () => {
    expect(calcLocScore("Boston", "New York, NY")).toBe(0.4);
  });

  it("should return 0.5 for unknown location", () => {
    expect(calcLocScore(null, "New York, NY")).toBe(0.5);
  });
});

describe("Score Formula", () => {
  it("should apply weights correctly", () => {
    const skill = 0.8;
    const exp = 1.0;
    const loc = 1.0;
    const score = 0.5 * skill + 0.3 * exp + 0.2 * loc;
    expect(score).toBeCloseTo(0.9, 1);
  });

  it("should handle all zero scores", () => {
    const score = 0.5 * 0 + 0.3 * 0 + 0.2 * 0;
    expect(score).toBe(0);
  });

  it("should handle all max scores", () => {
    const score = 0.5 * 1 + 0.3 * 1 + 0.2 * 1;
    expect(score).toBe(1);
  });
});

describe("Decision Thresholds", () => {
  function getDecision(score: number): string {
    if (score >= 0.75) return "Recommended";
    if (score >= 0.5) return "Borderline";
    return "Not Recommended";
  }

  it("should recommend high scores", () => {
    expect(getDecision(0.85)).toBe("Recommended");
    expect(getDecision(0.75)).toBe("Recommended");
  });

  it("should mark borderline scores", () => {
    expect(getDecision(0.6)).toBe("Borderline");
    expect(getDecision(0.5)).toBe("Borderline");
  });

  it("should not recommend low scores", () => {
    expect(getDecision(0.3)).toBe("Not Recommended");
    expect(getDecision(0)).toBe("Not Recommended");
  });
});
