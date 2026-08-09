import { IOpeningRepository, PaginatedResult, PaginationOptions } from "../../ports/repositories/IOpeningRepository.js";
import { ICandidateRepository } from "../../ports/repositories/ICandidateRepository.js";
import { Opening } from "../../domain/entities/index.js";
import { NotFoundError } from "../../domain/errors/index.js";

export interface ListOpeningsInput {
  tenantId: string;
  page: number;
  limit: number;
}

export interface OpeningWithStats extends Opening {
  stats?: {
    totalProfiles: number;
    submitted: number;
    shortlisted: number;
    rejected: number;
  };
  profilesCount?: number;
}

export class ListOpenings {
  constructor(
    private openingRepo: IOpeningRepository,
    private candidateRepo: ICandidateRepository
  ) {}

  async execute(input: ListOpeningsInput): Promise<PaginatedResult<OpeningWithStats>> {
    const result = await this.openingRepo.findByTenant(input.tenantId, {
      page: input.page,
      limit: input.limit,
    });

    const openingsWithStats: OpeningWithStats[] = await Promise.all(
      result.items.map(async (opening) => {
        const profiles = await this.candidateRepo.findByOpening(opening.id, {});
        return Object.assign(opening, { profilesCount: profiles.length }) as unknown as OpeningWithStats;
      })
    );

    return {
      items: openingsWithStats,
      pagination: result.pagination,
    };
  }
}

export class GetOpeningDetails {
  constructor(
    private openingRepo: IOpeningRepository,
    private candidateRepo: ICandidateRepository
  ) {}

  async execute(openingId: string, tenantId: string, userId?: string): Promise<any> {
    const opening = await this.openingRepo.findByIdAndTenant(openingId, tenantId);
    if (!opening) {
      throw new NotFoundError("Opening", openingId);
    }

    const profiles = await this.candidateRepo.findByOpening(openingId, {});
    return { ...opening, hiringProfiles: profiles };
  }
}
