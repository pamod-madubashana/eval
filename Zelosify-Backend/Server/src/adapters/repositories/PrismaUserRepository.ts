import prisma from "../../config/prisma/prisma.js";
import { User, Role, AuthProvider } from "../../domain/entities/index.js";
import { IUserRepository, CreateUserDTO } from "../../ports/repositories/IUserRepository.js";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const record = await prisma.user.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByExternalId(externalId: string): Promise<User | null> {
    const record = await prisma.user.findUnique({ where: { externalId } });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await prisma.user.findFirst({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  async findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
    const record = await prisma.user.findFirst({
      where: {
        OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      },
    });
    return record ? this.toDomain(record) : null;
  }

  async existsByUsernameOrEmail(username: string, email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { OR: [{ username }, { email }] },
    });
    return count > 0;
  }

  async create(data: CreateUserDTO): Promise<User> {
    const record = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        department: data.department,
        role: data.role as Role,
        tenantId: data.tenantId,
        externalId: data.externalId,
        totpSecret: data.totpSecret,
        provider: data.provider as AuthProvider,
        creator: data.creator,
      },
    });
    return this.toDomain(record);
  }

  async updateTokens(id: string, accessToken: string, refreshToken: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { accessToken, refreshToken },
    });
  }

  private toDomain(record: any): User {
    return new User({
      id: record.id,
      username: record.username,
      email: record.email,
      firstName: record.firstName,
      lastName: record.lastName,
      phoneNumber: record.phoneNumber,
      department: record.department,
      role: record.role as Role,
      tenantId: record.tenantId,
      externalId: record.externalId,
      provider: record.provider as AuthProvider,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
