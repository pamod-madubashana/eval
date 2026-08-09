import prisma from "../../config/prisma/prisma.js";
import { ITenantRepository } from "../../ports/repositories/ITenantRepository.js";

export class PrismaTenantRepository implements ITenantRepository {
  async findById(tenantId: string): Promise<{ tenantId: string; companyName: string } | null> {
    const record = await prisma.tenants.findUnique({ where: { tenantId } });
    if (!record) return null;
    return { tenantId: record.tenantId, companyName: record.companyName };
  }
}
