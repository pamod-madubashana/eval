import { ProfileNote } from "../../domain/entities/index.js";

export interface INoteRepository {
  findByProfile(profileId: number): Promise<ProfileNote[]>;
  findById(id: number): Promise<ProfileNote | null>;
  create(data: CreateNoteDTO): Promise<ProfileNote>;
  delete(id: number): Promise<void>;
}

export interface CreateNoteDTO {
  profileId: number;
  content: string;
  authorId: string;
  authorName: string;
}
