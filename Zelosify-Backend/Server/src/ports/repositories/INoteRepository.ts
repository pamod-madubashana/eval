import { ProfileNote } from "../../domain/entities/index.js";

export interface INoteRepository {
  findByProfile(profileId: number): Promise<ProfileNote[]>;
  findByProfileAndTenant(profileId: number, tenantId: string): Promise<ProfileNote[]>;
  findById(id: number): Promise<ProfileNote | null>;
  create(data: CreateNoteDTO): Promise<ProfileNote>;
  delete(id: number): Promise<void>;
  verifyProfileBelongsToTenant(profileId: number, tenantId: string): Promise<boolean>;
}

export interface CreateNoteDTO {
  profileId: number;
  content: string;
  authorId: string;
  authorName: string;
}
