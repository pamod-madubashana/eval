import { CandidateProfile, ProfileStatus } from "../../domain/entities/index.js";

export interface ICandidateRepository {
  findById(id: number): Promise<CandidateProfile | null>;
  findByIdAndTenant(id: number, tenantId: string): Promise<CandidateProfile | null>;
  findByIdAndOpening(id: number, openingId: string): Promise<CandidateProfile | null>;
  findByOpening(openingId: string, options: ProfileQueryOptions): Promise<CandidateProfile[]>;
  findByUploader(openingId: string, userId: string): Promise<CandidateProfile[]>;
  countByOpening(openingId: string): Promise<number>;
  countSubmittedByOpening(openingId: string): Promise<number>;
  countRecommendedByOpening(openingId: string): Promise<number>;
  avgScoreByTenant(tenantId: string): Promise<number>;
  countRecentByTenant(tenantId: string, since: Date): Promise<number>;
  countByStatusForTenant(tenantId: string): Promise<{ status: string; count: number }[]>;
  countTotalRecommendedByTenant(tenantId: string): Promise<number>;
  create(data: CreateProfileDTO, tenantId: string): Promise<CandidateProfile>;
  updateStatus(id: number, status: ProfileStatus, userId?: string, tenantId?: string): Promise<CandidateProfile>;
  softDelete(id: number, tenantId?: string): Promise<void>;
  updateRecommendation(id: number, data: RecommendationUpdateDTO, tenantId?: string): Promise<void>;
}

export interface ProfileQueryOptions {
  includeDeleted?: boolean;
  status?: ProfileStatus;
  onlyRecommended?: boolean;
}

export interface CreateProfileDTO {
  openingId: string;
  s3Key: string;
  uploadedBy: string;
}

export interface RecommendationUpdateDTO {
  recommended: boolean;
  recommendationScore: number;
  recommendationReason: string;
  recommendationLatencyMs: number;
  recommendationVersion: string;
  recommendationConfidence: number;
}
