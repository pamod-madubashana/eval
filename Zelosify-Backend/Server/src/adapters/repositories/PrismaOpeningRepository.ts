import prisma from "../../config/prisma/prisma.js";
import { Opening, OpeningStatus } from "../../domain/entities/index.js";
import {
  IOpeningRepository,
  PaginationOptions,
  PaginatedResult,
  StatusCount,
} from "../../ports/repositories/IOpeningRepository.js";

export class PrismaOpeningRepository implements IOpeningRepository {
  async findById(id: string): Promise<Opening | null> {
    const record = await prisma.opening.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<Opening | null> {
    const record = await prisma.opening.findFirst({ where: { id, tenantId } });
    return record ? this.toDomain(record) : null;
  }

  async findByTenant(
    tenantId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<Opening>> {
    const skip = (options.page - 1) * options.limit;
    const where: any = { tenantId };
    if (options.hiringManagerId) {
      where.hiringManagerId = options.hiringManagerId;
    }
    const [records, total] = await Promise.all([
      prisma.opening.findMany({
        where,
        orderBy: { postedDate: "desc" },
        skip,
        take: options.limit,
      }),
      prisma.opening.count({ where }),
    ]);

    return {
      items: records.map((r) => this.toDomain(r)),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async countByTenant(tenantId: string): Promise<number> {
    return prisma.opening.count({ where: { tenantId } });
  }

  async countByStatus(tenantId: string): Promise<StatusCount[]> {
    const results = await prisma.opening.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    });
    return results.map((r) => ({ status: r.status, count: r._count.id }));
  }

  private toDomain(record: any): Opening {
    return new Opening({
      id: record.id,
      tenantId: record.tenantId,
      title: record.title,
      description: record.description,
      location: record.location,
      contractType: record.contractType,
      hiringManagerId: record.hiringManagerId,
      experienceMin: record.experienceMin,
      experienceMax: record.experienceMax,
      postedDate: record.postedDate,
      expectedCompletionDate: record.expectedCompletionDate,
      actionDate: record.actionDate,
      status: record.status as OpeningStatus,
    });
  }
}
