import { describe, it, expect } from "vitest";

// Test the skill extraction logic directly
function extractSkills(text: string): string[] {
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

function extractExperienceYears(text: string): number | null {
  const patterns = [
    /(\d+)\+?\s*years?\s*(of\s+)?experience/gi,
    /experience\s*[:=]\s*(\d+)\+?\s*years?/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      const years = parseInt(match[1], 10);
      if (years >= 0 && years <= 50) {
        return years;
      }
    }
  }
  return null;
}

function extractEmail(text: string): string | null {
  const emailPattern = /[\w.-]+@[\w.-]+\.\w{2,}/g;
  const match = text.match(emailPattern);
  return match ? match[0] : null;
}

describe("Resume Parser - Skill Extraction", () => {
  it("should extract programming languages", () => {
    const text = "Experience with JavaScript, Python, and Java";
    const skills = extractSkills(text);
    expect(skills).toContain("JavaScript");
    expect(skills).toContain("Python");
    expect(skills).toContain("Java");
  });

  it("should extract frameworks", () => {
    const text = "Built applications using React, Node.js, and Express";
    const skills = extractSkills(text);
    expect(skills).toContain("React");
    expect(skills).toContain("Node.js");
    expect(skills).toContain("Express");
  });

  it("should extract databases and cloud", () => {
    const text = "Deployed on AWS with PostgreSQL and Redis";
    const skills = extractSkills(text);
    expect(skills).toContain("AWS");
    expect(skills).toContain("PostgreSQL");
    expect(skills).toContain("Redis");
  });

  it("should return empty array for no matches", () => {
    const text = "No technical skills mentioned here";
    const skills = extractSkills(text);
    expect(skills).toHaveLength(0);
  });
});

describe("Resume Parser - Experience Extraction", () => {
  it("should extract years from '5 years experience'", () => {
    const text = "5 years of experience in software development";
    const years = extractExperienceYears(text);
    expect(years).toBe(5);
  });

  it("should extract years from 'experience: 3 years'", () => {
    const text = "experience: 3 years in backend development";
    const years = extractExperienceYears(text);
    expect(years).toBe(3);
  });

  it("should extract years with plus sign", () => {
    const text = "10+ years of experience in the industry";
    const years = extractExperienceYears(text);
    expect(years).toBe(10);
  });

  it("should return null when no experience found", () => {
    const text = "Senior software engineer";
    const years = extractExperienceYears(text);
    expect(years).toBeNull();
  });
});

describe("Resume Parser - Email Extraction", () => {
  it("should extract email address", () => {
    const text = "Contact me at john.doe@example.com for more info";
    const email = extractEmail(text);
    expect(email).toBe("john.doe@example.com");
  });

  it("should return null for no email", () => {
    const text = "No email provided here";
    const email = extractEmail(text);
    expect(email).toBeNull();
  });
});
