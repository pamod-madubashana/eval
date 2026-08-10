import prisma from "../../config/prisma/prisma.js";
import { ProfileNote } from "../../domain/entities/index.js";
import { INoteRepository, CreateNoteDTO } from "../../ports/repositories/INoteRepository.js";

export class PrismaNoteRepository implements INoteRepository {
  async findByProfile(profileId: number): Promise<ProfileNote[]> {
    const records = await prisma.profileNote.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByProfileAndTenant(profileId: number, tenantId: string): Promise<ProfileNote[]> {
    const records = await prisma.profileNote.findMany({
      where: {
        profileId,
        profile: { opening: { tenantId } },
      },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findById(id: number): Promise<ProfileNote | null> {
    const record = await prisma.profileNote.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateNoteDTO): Promise<ProfileNote> {
    const record = await prisma.profileNote.create({
      data: {
        profileId: data.profileId,
        content: data.content,
        authorId: data.authorId,
        authorName: data.authorName,
      },
    });
    return this.toDomain(record);
  }

  async delete(id: number): Promise<void> {
    await prisma.profileNote.delete({ where: { id } });
  }

  async verifyProfileBelongsToTenant(profileId: number, tenantId: string): Promise<boolean> {
    const count = await prisma.hiringProfile.count({
      where: {
        id: profileId,
        opening: { tenantId },
      },
    });
    return count > 0;
  }

  private toDomain(record: any): ProfileNote {
    return new ProfileNote({
      id: record.id,
      profileId: record.profileId,
      content: record.content,
      authorId: record.authorId,
      authorName: record.authorName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
