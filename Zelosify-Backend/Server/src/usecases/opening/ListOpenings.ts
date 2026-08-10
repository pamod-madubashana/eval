import { IOpeningRepository, PaginatedResult } from "../../ports/repositories/IOpeningRepository.js";
import { ICandidateRepository } from "../../ports/repositories/ICandidateRepository.js";
import { IUserRepository } from "../../ports/repositories/IUserRepository.js";
import { Opening } from "../../domain/entities/index.js";
import { NotFoundError } from "../../domain/errors/index.js";

export interface ListOpeningsInput {
  tenantId: string;
  page: number;
  limit: number;
  hiringManagerId?: string;
}

export class ListOpenings {
  constructor(
    private openingRepo: IOpeningRepository,
    private candidateRepo: ICandidateRepository
  ) {}

  async execute(input: ListOpeningsInput): Promise<PaginatedResult<any>> {
    const result = await this.openingRepo.findByTenant(input.tenantId, {
      page: input.page,
      limit: input.limit,
      hiringManagerId: input.hiringManagerId,
    });

    const openingsWithStats = await Promise.all(
      result.items.map(async (opening) => {
        const profiles = await this.candidateRepo.findByOpening(opening.id, {});
        const plain = opening.toJSON();
        return {
          ...plain,
          stats: {
            totalProfiles: profiles.length,
            submitted: profiles.filter((p) => p.status === "SUBMITTED").length,
            shortlisted: profiles.filter((p) => p.status === "SHORTLISTED").length,
            rejected: profiles.filter((p) => p.status === "REJECTED").length,
          },
        };
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
    private candidateRepo: ICandidateRepository,
    private userRepo?: IUserRepository
  ) {}

  async execute(openingId: string, tenantId: string, userId?: string): Promise<any> {
    const opening = await this.openingRepo.findByIdAndTenant(openingId, tenantId);
    if (!opening) {
      throw new NotFoundError("Opening", openingId);
    }

    // Resolve hiring manager name
    let hiringManagerName: string | undefined;
    if (this.userRepo) {
      const manager = await this.userRepo.findById(opening.hiringManagerId);
      if (manager) {
        hiringManagerName = manager.displayName;
      }
    }

    // Vendor sees only their own profiles; manager sees all
    const profiles = userId
      ? await this.candidateRepo.findByUploader(openingId, userId)
      : await this.candidateRepo.findByOpening(openingId, {});

    // Enrich profiles with uploader name (for hiring manager view)
    const profilesEnriched = await Promise.all(
      profiles.map(async (p) => {
        const plain = p.toJSON() as any;
        if (!userId && this.userRepo) {
          const uploader = await this.userRepo.findById(p.uploadedBy);
          if (uploader) {
            plain.uploaderName = uploader.displayName;
            plain.uploaderEmail = uploader.email;
          }
        }
        return plain;
      })
    );

    return {
      ...opening.toJSON(),
      hiringManagerName,
      hiringProfiles: profilesEnriched,
    };
  }
}
