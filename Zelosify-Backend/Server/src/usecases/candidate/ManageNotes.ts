import { INoteRepository, CreateNoteDTO } from "../../ports/repositories/INoteRepository.js";
import { ProfileNote } from "../../domain/entities/index.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../domain/errors/index.js";

export class GetNotes {
  constructor(private noteRepo: INoteRepository) {}

  async execute(profileId: number, tenantId: string): Promise<ProfileNote[]> {
    return this.noteRepo.findByProfileAndTenant(profileId, tenantId);
  }
}

export class AddNote {
  constructor(private noteRepo: INoteRepository) {}

  async execute(profileId: number, content: string, authorId: string, authorName: string, tenantId: string): Promise<ProfileNote> {
    if (!content || content.trim().length === 0) {
      throw new ValidationError("Content is required");
    }

    const belongsToTenant = await this.noteRepo.verifyProfileBelongsToTenant(profileId, tenantId);
    if (!belongsToTenant) {
      throw new ForbiddenError("Profile does not belong to your tenant");
    }

    return this.noteRepo.create({
      profileId,
      content: content.trim(),
      authorId,
      authorName,
    });
  }
}

export class DeleteNote {
  constructor(private noteRepo: INoteRepository) {}

  async execute(noteId: number, userId: string, tenantId: string): Promise<void> {
    const note = await this.noteRepo.findById(noteId);
    if (!note) throw new NotFoundError("Note", noteId);

    if (!note.isAuthoredBy(userId)) {
      throw new ForbiddenError("You can only delete your own notes");
    }

    const belongsToTenant = await this.noteRepo.verifyProfileBelongsToTenant(note.profileId, tenantId);
    if (!belongsToTenant) {
      throw new ForbiddenError("Profile does not belong to your tenant");
    }

    await this.noteRepo.delete(noteId);
  }
}
