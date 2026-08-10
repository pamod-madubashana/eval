export interface IResumeParser {
  parse(s3Key: string): Promise<ParsedResume>;
}

export interface ParsedResume {
  skills: string[];
  normalizedSkills: string[];
  experienceYears: number | null;
  location: string | null;
  education: string[];
  rawText: string;
}
