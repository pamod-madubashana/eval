export interface ITenantRepository {
  findById(tenantId: string): Promise<{ tenantId: string; companyName: string } | null>;
}
