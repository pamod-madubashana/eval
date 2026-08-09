import { describe, it, expect } from "vitest";

// Test the deterministic scoring logic
interface OpeningData {
  title: string;
  description: string;
  location: string;
  contractType: string;
  experienceMin: number;
  experienceMax: number;
}

interface ParsedResume {
  skills: string[];
  experienceYears: number | null;
  location: string | null;
}

function extractJobSkills(text: string): string[] {
  const skillPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Ruby|Go|Rust|PHP|Swift|Kotlin)\b/gi,
    /\b(React|Angular|Vue\.?js|Next\.?js|Node\.?js|Express|Django|Flask|Spring)\b/gi,
    /\b(PostgreSQL|MySQL|MongoDB|Redis|Docker|Kubernetes|AWS|Azure|GCP)\b/gi,
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

function calculateScore(
  opening: OpeningData,
  parsedResume: ParsedResume
): { score: number; skillScore: number; experienceScore: number; locationScore: number } {
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

  const candidateExp = parsedResume.experienceYears;
  let experienceScore = 0.5;
  if (candidateExp !== null) {
    if (candidateExp < opening.experienceMin) {
      experienceScore = Math.max(0, 1 - (opening.experienceMin - candidateExp) * 0.2);
    } else if (candidateExp > opening.experienceMax) {
      experienceScore = 0.8;
    } else {
      experienceScore = 1.0;
    }
  }

  let locationScore = 0.5;
  const openingLoc = opening.location.toLowerCase();
  const candidateLoc = parsedResume.location?.toLowerCase() || "";

  if (openingLoc.includes("remote")) {
    locationScore = 1.0;
  } else if (candidateLoc && openingLoc.includes(candidateLoc)) {
    locationScore = 1.0;
  } else if (candidateLoc) {
    locationScore = 0.4;
  }

  const score = 0.5 * skillScore + 0.3 * experienceScore + 0.2 * locationScore;

  return { score, skillScore, experienceScore, locationScore };
}

describe("Scoring Engine - Skill Matching", () => {
  it("should give high score for matching skills", () => {
    const opening: OpeningData = {
      title: "React Developer",
      description: "Looking for JavaScript and React developer",
      location: "Remote",
      contractType: "Full-Time",
      experienceMin: 3,
      experienceMax: 7,
    };

    const resume: ParsedResume = {
      skills: ["JavaScript", "React", "Node.js"],
      experienceYears: 5,
      location: "New York",
    };

    const { skillScore } = calculateScore(opening, resume);
    expect(skillScore).toBeGreaterThanOrEqual(0.5);
  });

  it("should give lower score for missing skills", () => {
    const opening: OpeningData = {
      title: "Python Developer",
      description: "Python and Django experience required",
      location: "Remote",
      contractType: "Full-Time",
      experienceMin: 3,
      experienceMax: 7,
    };

    const resume: ParsedResume = {
      skills: ["JavaScript", "React"],
      experienceYears: 5,
      location: "New York",
    };

    const { skillScore } = calculateScore(opening, resume);
    expect(skillScore).toBeLessThan(0.5);
  });
});

describe("Scoring Engine - Experience Matching", () => {
  it("should give perfect score for experience in range", () => {
    const opening: OpeningData = {
      title: "Senior Developer",
      description: "5-10 years experience",
      location: "Remote",
      contractType: "Full-Time",
      experienceMin: 5,
      experienceMax: 10,
    };

    const resume: ParsedResume = {
      skills: ["JavaScript"],
      experienceYears: 7,
      location: "New York",
    };

    const { experienceScore } = calculateScore(opening, resume);
    expect(experienceScore).toBe(1.0);
  });

  it("should give reduced score for under-qualified", () => {
    const opening: OpeningData = {
      title: "Senior Developer",
      description: "5-10 years experience",
      location: "Remote",
      contractType: "Full-Time",
      experienceMin: 5,
      experienceMax: 10,
    };

    const resume: ParsedResume = {
      skills: ["JavaScript"],
      experienceYears: 2,
      location: "New York",
    };

    const { experienceScore } = calculateScore(opening, resume);
    expect(experienceScore).toBeLessThan(1.0);
  });

  it("should give 0.8 for over-qualified", () => {
    const opening: OpeningData = {
      title: "Junior Developer",
      description: "1-3 years experience",
      location: "Remote",
      contractType: "Full-Time",
      experienceMin: 1,
      experienceMax: 3,
    };

    const resume: ParsedResume = {
      skills: ["JavaScript"],
      experienceYears: 15,
      location: "New York",
    };

    const { experienceScore } = calculateScore(opening, resume);
    expect(experienceScore).toBe(0.8);
  });

  it("should give default score when experience unknown", () => {
    const opening: OpeningData = {
      title: "Developer",
      description: "3-5 years experience",
      location: "Remote",
      contractType: "Full-Time",
      experienceMin: 3,
      experienceMax: 5,
    };

    const resume: ParsedResume = {
      skills: ["JavaScript"],
      experienceYears: null,
      location: "New York",
    };

    const { experienceScore } = calculateScore(opening, resume);
    expect(experienceScore).toBe(0.5);
  });
});

describe("Scoring Engine - Location Matching", () => {
  it("should give perfect score for remote position", () => {
    const opening: OpeningData = {
      title: "Developer",
      description: "Remote position",
      location: "Remote",
      contractType: "Full-Time",
      experienceMin: 3,
      experienceMax: 5,
    };

    const resume: ParsedResume = {
      skills: ["JavaScript"],
      experienceYears: 5,
      location: "New York",
    };

    const { locationScore } = calculateScore(opening, resume);
    expect(locationScore).toBe(1.0);
  });

  it("should give reduced score for different location", () => {
    const opening: OpeningData = {
      title: "Developer",
      description: "Onsite position",
      location: "San Francisco, CA",
      contractType: "Full-Time",
      experienceMin: 3,
      experienceMax: 5,
    };

    const resume: ParsedResume = {
      skills: ["JavaScript"],
      experienceYears: 5,
      location: "New York",
    };

    const { locationScore } = calculateScore(opening, resume);
    expect(locationScore).toBe(0.4);
  });
});

describe("Scoring Engine - Overall Score", () => {
  it("should calculate weighted score correctly", () => {
    const opening: OpeningData = {
      title: "React Developer",
      description: "JavaScript and React",
      location: "Remote",
      contractType: "Full-Time",
      experienceMin: 3,
      experienceMax: 7,
    };

    const resume: ParsedResume = {
      skills: ["JavaScript", "React"],
      experienceYears: 5,
      location: "New York",
    };

    const { score, skillScore, experienceScore, locationScore } = calculateScore(opening, resume);
    
    // Verify weighted formula
    const expectedScore = 0.5 * skillScore + 0.3 * experienceScore + 0.2 * locationScore;
    expect(score).toBeCloseTo(expectedScore, 5);
    
    // Score should be between 0 and 1
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
