export { OpeningStatus, ProfileStatus, Role, AuthProvider } from "../enums/index.js";
import { OpeningStatus, ProfileStatus, Role, AuthProvider } from "../enums/index.js";

// ─── User Entity ─────────────────────────────────────────────────

export interface UserProps {
  id: string;
  username: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  department: string | null;
  role: Role;
  tenantId: string | null;
  externalId: string | null;
  provider: AuthProvider;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(public readonly props: UserProps) {}

  get id(): string { return this.props.id; }
  get username(): string | null { return this.props.username; }
  get email(): string { return this.props.email; }
  get firstName(): string | null { return this.props.firstName; }
  get lastName(): string | null { return this.props.lastName; }
  get phoneNumber(): string | null { return this.props.phoneNumber; }
  get department(): string | null { return this.props.department; }
  get role(): Role { return this.props.role; }
  get tenantId(): string | null { return this.props.tenantId; }
  get provider(): AuthProvider { return this.props.provider; }

  get displayName(): string {
    if (this.props.firstName) {
      return `${this.props.firstName} ${this.props.lastName || ""}`.trim();
    }
    return this.props.username || "Unknown";
  }

  hasRole(role: Role): boolean {
    return this.props.role === role;
  }

  belongsToTenant(tenantId: string): boolean {
    return this.props.tenantId === tenantId;
  }

  toJSON() {
    return { ...this.props };
  }
}

// ─── Opening Entity ──────────────────────────────────────────────

export interface OpeningProps {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  location: string | null;
  contractType: string | null;
  hiringManagerId: string;
  experienceMin: number;
  experienceMax: number | null;
  postedDate: Date;
  expectedCompletionDate: Date | null;
  actionDate: Date | null;
  status: OpeningStatus;
}

export class Opening {
  [key: string]: any;
  constructor(public readonly props: OpeningProps) {}

  get id(): string { return this.props.id; }
  get tenantId(): string { return this.props.tenantId; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description; }
  get location(): string | null { return this.props.location; }
  get experienceMin(): number { return this.props.experienceMin; }
  get experienceMax(): number { return this.props.experienceMax ?? this.props.experienceMin; }
  get status(): OpeningStatus { return this.props.status; }

  isOpen(): boolean {
    return this.props.status === OpeningStatus.OPEN;
  }

  belongsToTenant(tenantId: string): boolean {
    return this.props.tenantId === tenantId;
  }

  toJSON() {
    return { ...this.props };
  }
}

// ─── CandidateProfile Entity ─────────────────────────────────────

export interface CandidateProfileProps {
  id: number;
  openingId: string;
  s3Key: string;
  uploadedBy: string;
  submittedAt: Date;
  status: ProfileStatus;
  shortlistedBy: string | null;
  shortlistedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  recommended: boolean | null;
  recommendationScore: number | null;
  recommendationReason: string | null;
  recommendationLatencyMs: number | null;
  recommendationVersion: string | null;
  recommendationConfidence: number | null;
  recommendedAt: Date | null;
  isDeleted: boolean;
}

export class CandidateProfile {
  constructor(public readonly props: CandidateProfileProps) {}

  get id(): number { return this.props.id; }
  get openingId(): string { return this.props.openingId; }
  get s3Key(): string { return this.props.s3Key; }
  get uploadedBy(): string { return this.props.uploadedBy; }
  get status(): ProfileStatus { return this.props.status; }
  get isDeleted(): boolean { return this.props.isDeleted; }
  get recommended(): boolean | null { return this.props.recommended; }
  get recommendationScore(): number | null { return this.props.recommendationScore; }

  isSubmitted(): boolean {
    return this.props.status === ProfileStatus.SUBMITTED && !this.props.isDeleted;
  }

  wasUploadedBy(userId: string): boolean {
    return this.props.uploadedBy === userId;
  }

  toJSON() {
    return { ...this.props };
  }
}

// ─── Score Value Object ──────────────────────────────────────────

export interface ScoreProps {
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
  finalScore: number;
}

export class Score {
  constructor(public readonly props: ScoreProps) {}

  get finalScore(): number { return this.props.finalScore; }
  get skillMatchScore(): number { return this.props.skillMatchScore; }
  get experienceMatchScore(): number { return this.props.experienceMatchScore; }
  get locationMatchScore(): number { return this.props.locationMatchScore; }

  get decision(): string {
    if (this.props.finalScore >= 0.75) return "Recommended";
    if (this.props.finalScore >= 0.5) return "Borderline";
    return "Not Recommended";
  }

  isRecommended(): boolean {
    return this.props.finalScore >= 0.75;
  }

  toJSON() {
    return { ...this.props };
  }

  static calculate(
    skillMatch: number,
    experienceMatch: number,
    locationMatch: number
  ): Score {
    const finalScore =
      0.5 * skillMatch + 0.3 * experienceMatch + 0.2 * locationMatch;
    return new Score({
      skillMatchScore: skillMatch,
      experienceMatchScore: experienceMatch,
      locationMatchScore: locationMatch,
      finalScore,
    });
  }
}

// ─── ProfileNote Entity ──────────────────────────────────────────

export interface ProfileNoteProps {
  id: number;
  profileId: number;
  content: string;
  authorId: string;
  authorName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProfileNote {
  constructor(public readonly props: ProfileNoteProps) {}

  get id(): number { return this.props.id; }
  get profileId(): number { return this.props.profileId; }
  get content(): string { return this.props.content; }
  get authorId(): string { return this.props.authorId; }
  get authorName(): string | null { return this.props.authorName; }

  isAuthoredBy(userId: string): boolean {
    return this.props.authorId === userId;
  }

  toJSON() {
    return { ...this.props };
  }
}

// ─── Tenant Entity ───────────────────────────────────────────────

export interface TenantProps {
  tenantId: string;
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Tenant {
  constructor(public readonly props: TenantProps) {}

  get id(): string { return this.props.tenantId; }
  get companyName(): string { return this.props.companyName; }
}
