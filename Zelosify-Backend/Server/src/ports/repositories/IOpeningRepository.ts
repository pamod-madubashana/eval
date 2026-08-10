import { Opening, OpeningStatus } from "../../domain/entities/index.js";

export interface IOpeningRepository {
  findById(id: string): Promise<Opening | null>;
  findByIdAndTenant(id: string, tenantId: string): Promise<Opening | null>;
  findByTenant(tenantId: string, options: PaginationOptions): Promise<PaginatedResult<Opening>>;
  countByTenant(tenantId: string): Promise<number>;
  countByStatus(tenantId: string): Promise<StatusCount[]>;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  hiringManagerId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StatusCount {
  status: string;
  count: number;
}
