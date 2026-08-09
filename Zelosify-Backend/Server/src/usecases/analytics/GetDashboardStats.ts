import { ICandidateRepository } from "../../ports/repositories/ICandidateRepository.js";
import { IOpeningRepository } from "../../ports/repositories/IOpeningRepository.js";
import { DashboardStats } from "./types.js";
import { NotFoundError } from "../../domain/errors/index.js";

export class GetDashboardStats {
  constructor(
    private openingRepo: IOpeningRepository,
    private candidateRepo: ICandidateRepository
  ) {}

  async execute(tenantId: string): Promise<DashboardStats> {
    const [openingsByStatus, profileStatusCounts, totalOpenings, avgScore, recentCount, totalCount] =
      await Promise.all([
        this.openingRepo.countByStatus(tenantId),
        (this.candidateRepo as any).countByStatusForTenant(tenantId),
        this.openingRepo.countByTenant(tenantId),
        this.candidateRepo.avgScoreByTenant(tenantId),
        this.candidateRepo.countRecentByTenant(tenantId, this.sevenDaysAgo()),
        (this.candidateRepo as any).countTotalRecommendedByTenant(tenantId),
      ]);

    const openingsByStatusMap: Record<string, number> = {};
    for (const item of openingsByStatus) {
      openingsByStatusMap[item.status] = item.count;
    }

    const profilesByStatusMap: Record<string, number> = {};
    for (const item of profileStatusCounts) {
      profilesByStatusMap[item.status] = item.count;
    }

    const totalProfiles = profileStatusCounts.reduce((sum: number, item: { status: string; count: number }) => sum + item.count, 0);

    return {
      openings: {
        total: totalOpenings,
        byStatus: openingsByStatusMap,
      },
      profiles: {
        total: totalProfiles,
        byStatus: profilesByStatusMap,
        recent: recentCount,
      },
      recommendations: {
        total: totalCount,
        avgScore,
      },
    };
  }

  private sevenDaysAgo(): Date {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }
}
