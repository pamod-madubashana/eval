import { Readable } from "stream";
import { createStorageService } from "../../storage/storageFactory.js";

export interface ParsedResume {
  text: string;
  skills: string[];
  experienceYears: number | null;
  education: string[];
  location: string | null;
  email: string | null;
  phone: string | null;
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfExtract = (await import("pdf-extraction")).default;
  const data = await pdfExtract(buffer);
  return data.text || "";
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

function extractSkills(text: string): string[] {
  const skillPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Ruby|Go|Rust|PHP|Swift|Kotlin|R|MATLAB|Scala|Perl)\b/gi,
    /\b(React|Angular|Vue\.?js|Next\.?js|Nuxt\.?js|Svelte|HTML|CSS|SASS|LESS|Tailwind|Bootstrap|jQuery)\b/gi,
    /\b(Node\.?js|Express|Django|Flask|Spring|Rails|Laravel|ASP\.NET|FastAPI|NestJS)\b/gi,
    /\b(PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|DynamoDB|Cassandra|SQLite|Oracle|SQL Server)\b/gi,
    /\b(AWS|Azure|GCP|Docker|Kubernetes|Terraform|Jenkins|CI\/CD|GitHub Actions|GitLab CI|Ansible)\b/gi,
    /\b(TensorFlow|PyTorch|Scikit-learn|Pandas|NumPy|Machine Learning|Deep Learning|NLP|Computer Vision)\b/gi,
    /\b(Git|Linux|Agile|Scrum|Jira|Confluence|Figma|Photoshop)\b/gi,
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
    /(\d+)\+?\s*years?\s*(in|with|of)\s+(software|engineering|development|IT|technology)/gi,
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

function extractEducation(text: string): string[] {
  const educationPatterns = [
    /(?:Bachelor|B\.?S\.?|B\.?A\.?|Undergraduate)\s+(?:of|in)?\s*([^\n,]+)/gi,
    /(?:Master|M\.?S\.?|M\.?A\.?|Graduate)\s+(?:of|in)?\s*([^\n,]+)/gi,
    /(?:Ph\.?D\.?|Doctorate|Doctoral)\s+(?:of|in)?\s*([^\n,]+)/gi,
    /(?:Associate|A\.?S\.?|A\.?A\.?)\s+(?:of|in)?\s*([^\n,]+)/gi,
  ];

  const education = new Set<string>();
  for (const pattern of educationPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      education.add(match[0].trim());
    }
  }
  return Array.from(education);
}

function extractLocation(text: string): string | null {
  const locationPatterns = [
    /(?:Location|Address|City|Based in|Located in)\s*[:=]\s*([^\n,]+)/gi,
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2})\b/g,
    /\b(Remote)\b/gi,
  ];

  for (const pattern of locationPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractEmail(text: string): string | null {
  const emailPattern = /[\w.-]+@[\w.-]+\.\w{2,}/g;
  const match = text.match(emailPattern);
  return match ? match[0] : null;
}

function extractPhone(text: string): string | null {
  const phonePatterns = [
    /(?:Phone|Tel|Mobile|Cell)\s*[:=]\s*([+\d\s()-]+)/gi,
    /(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g,
  ];

  for (const pattern of phonePatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

export async function parseResume(s3Key: string): Promise<ParsedResume> {
  const storageService = createStorageService();
  const stream = await storageService.getObjectStream(s3Key);
  const buffer = await streamToBuffer(stream);

  let text = "";
  if (s3Key.toLowerCase().endsWith(".pdf")) {
    text = await extractTextFromPDF(buffer);
  } else {
    text = buffer.toString("utf-8");
  }

  return {
    text,
    skills: extractSkills(text),
    experienceYears: extractExperienceYears(text),
    education: extractEducation(text),
    location: extractLocation(text),
    email: extractEmail(text),
    phone: extractPhone(text),
  };
}
