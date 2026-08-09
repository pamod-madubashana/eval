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
  normalizedSkills: string[];
  keywords: string[];
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfExtract = (await import("pdf-extraction")).default;
  const data = await pdfExtract(buffer);
  return data.text || "";
}

async function extractTextFromPPTX(buffer: Buffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const slides: string[] = [];

  const slideFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml")
  );

  for (const slideFile of slideFiles.sort()) {
    const content = await zip.file(slideFile)?.async("string");
    if (content) {
      const textMatches = content.match(/<a:t>([^<]+)<\/a:t>/g);
      if (textMatches) {
        const slideText = textMatches
          .map((t) => t.replace(/<\/?a:t>/g, ""))
          .join(" ");
        slides.push(slideText);
      }
    }
  }

  return slides.join("\n");
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

const SKILL_SYNONYMS: Record<string, string> = {
  js: "JavaScript",
  ts: "TypeScript",
  reactjs: "React",
  reactjs: "React",
  nodejs: "Node.js",
  node: "Node.js",
  vuejs: "Vue.js",
  vue: "Vue.js",
  nextjs: "Next.js",
  next: "Next.js",
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
  k8s: "Kubernetes",
  tf: "TensorFlow",
  pytorch: "PyTorch",
  postgres: "PostgreSQL",
  mongo: "MongoDB",
  ci: "CI/CD",
  cd: "CI/CD",
};

function normalizeSkill(skill: string): string {
  const lower = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
  return SKILL_SYNONYMS[lower] || skill;
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

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "this", "that",
    "these", "those", "i", "you", "he", "she", "it", "we", "they",
  ]);

  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq = new Map<string, number>();
  for (const word of words) {
    if (!stopWords.has(word)) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

export async function parseResume(s3Key: string): Promise<ParsedResume> {
  const storageService = createStorageService();
  const stream = await storageService.getObjectStream(s3Key);
  const buffer = await streamToBuffer(stream);

  let text = "";
  const lowerKey = s3Key.toLowerCase();
  if (lowerKey.endsWith(".pdf")) {
    text = await extractTextFromPDF(buffer);
  } else if (lowerKey.endsWith(".pptx")) {
    text = await extractTextFromPPTX(buffer);
  } else {
    text = buffer.toString("utf-8");
  }

  const skills = extractSkills(text);

  return {
    text,
    skills,
    experienceYears: extractExperienceYears(text),
    education: extractEducation(text),
    location: extractLocation(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    normalizedSkills: skills.map(normalizeSkill),
    keywords: extractKeywords(text),
  };
}
