import prisma from "../../config/prisma/prisma.js";
import { CandidateProfile, ProfileStatus } from "../../domain/entities/index.js";
import {
  ICandidateRepository,
  ProfileQueryOptions,
  CreateProfileDTO,
  RecommendationUpdateDTO,
} from "../../ports/repositories/ICandidateRepository.js";

export class PrismaCandidateRepository implements ICandidateRepository {
  async findById(id: number): Promise<CandidateProfile | null> {
    const record = await prisma.hiringProfile.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByIdAndTenant(id: number, tenantId: string): Promise<CandidateProfile | null> {
    const record = await prisma.hiringProfile.findFirst({
      where: { id, opening: { tenantId }, isDeleted: false },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByIdAndOpening(id: number, openingId: string): Promise<CandidateProfile | null> {
    const record = await prisma.hiringProfile.findFirst({
      where: { id, openingId, isDeleted: false },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByOpening(openingId: string, options: ProfileQueryOptions): Promise<CandidateProfile[]> {
    const where: any = { openingId };
    if (!options.includeDeleted) where.isDeleted = false;
    if (options.status) where.status = options.status;
    if (options.onlyRecommended) where.recommended = true;

    const records = await prisma.hiringProfile.findMany({
      where,
      orderBy: { submittedAt: "desc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByUploader(openingId: string, userId: string): Promise<CandidateProfile[]> {
    const records = await prisma.hiringProfile.findMany({
      where: { openingId, uploadedBy: userId, isDeleted: false },
      orderBy: { submittedAt: "desc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async countByOpening(openingId: string): Promise<number> {
    return prisma.hiringProfile.count({
      where: { openingId, isDeleted: false },
    });
  }

  async countSubmittedByOpening(openingId: string): Promise<number> {
    return prisma.hiringProfile.count({
      where: { openingId, status: "SUBMITTED", isDeleted: false },
    });
  }

  async countRecommendedByOpening(openingId: string): Promise<number> {
    return prisma.hiringProfile.count({
      where: { openingId, isDeleted: false, recommended: true },
    });
  }

  async avgScoreByTenant(tenantId: string): Promise<number> {
    const result = await prisma.hiringProfile.aggregate({
      where: {
        opening: { tenantId },
        isDeleted: false,
        recommended: true,
      },
      _avg: { recommendationScore: true },
    });
    return result._avg.recommendationScore || 0;
  }

  async countRecentByTenant(tenantId: string, since: Date): Promise<number> {
    return prisma.hiringProfile.count({
      where: {
        opening: { tenantId },
        isDeleted: false,
        submittedAt: { gte: since },
      },
    });
  }

  async countByStatusForTenant(tenantId: string): Promise<{ status: string; count: number }[]> {
    const results = await prisma.hiringProfile.groupBy({
      by: ["status"],
      where: {
        opening: { tenantId },
        isDeleted: false,
      },
      _count: { id: true },
    });
    return results.map((r) => ({ status: r.status, count: r._count.id }));
  }

  async countTotalRecommendedByTenant(tenantId: string): Promise<number> {
    return prisma.hiringProfile.count({
      where: {
        opening: { tenantId },
        isDeleted: false,
        recommended: true,
      },
    });
  }

  async create(data: CreateProfileDTO, tenantId: string): Promise<CandidateProfile> {
    // Verify opening belongs to tenant
    const opening = await prisma.opening.findFirst({
      where: { id: data.openingId, tenantId },
    });
    if (!opening) {
      throw new Error(`Opening ${data.openingId} not found for tenant`);
    }

    const record = await prisma.hiringProfile.create({
      data: {
        openingId: data.openingId,
        s3Key: data.s3Key,
        uploadedBy: data.uploadedBy,
      },
    });
    return this.toDomain(record);
  }

  async updateStatus(id: number, status: ProfileStatus, userId?: string, tenantId?: string): Promise<CandidateProfile> {
    const updateData: any = { status };
    if (status === ProfileStatus.SHORTLISTED) {
      updateData.shortlistedBy = userId;
      updateData.shortlistedAt = new Date();
    } else if (status === ProfileStatus.REJECTED) {
      updateData.rejectedBy = userId;
      updateData.rejectedAt = new Date();
    }

    const where: any = { id };
    if (tenantId) {
      where.opening = { tenantId };
    }

    const record = await prisma.hiringProfile.update({
      where,
      data: updateData,
    });
    return this.toDomain(record);
  }

  async softDelete(id: number, tenantId?: string): Promise<void> {
    const where: any = { id };
    if (tenantId) {
      where.opening = { tenantId };
    }

    await prisma.hiringProfile.update({
      where,
      data: { isDeleted: true },
    });
  }

  async updateRecommendation(id: number, data: RecommendationUpdateDTO, tenantId?: string): Promise<void> {
    const where: any = { id };
    if (tenantId) {
      where.opening = { tenantId };
    }

    await prisma.hiringProfile.update({
      where,
      data: {
        recommended: data.recommended,
        recommendationScore: data.recommendationScore,
        recommendationReason: data.recommendationReason,
        recommendationLatencyMs: data.recommendationLatencyMs,
        recommendationVersion: data.recommendationVersion,
        recommendationConfidence: data.recommendationConfidence,
        recommendedAt: new Date(),
      },
    });
  }

  private toDomain(record: any): CandidateProfile {
    return new CandidateProfile({
      id: record.id,
      openingId: record.openingId,
      s3Key: record.s3Key,
      uploadedBy: record.uploadedBy,
      submittedAt: record.submittedAt,
      status: record.status as ProfileStatus,
      shortlistedBy: record.shortlistedBy,
      shortlistedAt: record.shortlistedAt,
      rejectedBy: record.rejectedBy,
      rejectedAt: record.rejectedAt,
      recommended: record.recommended,
      recommendationScore: record.recommendationScore,
      recommendationReason: record.recommendationReason,
      recommendationLatencyMs: record.recommendationLatencyMs,
      recommendationVersion: record.recommendationVersion,
      recommendationConfidence: record.recommendationConfidence,
      recommendedAt: record.recommendedAt,
      isDeleted: record.isDeleted,
    });
  }
}
