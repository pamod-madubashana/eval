import { INoteRepository, CreateNoteDTO } from "../../ports/repositories/INoteRepository.js";
import { ProfileNote } from "../../domain/entities/index.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../domain/errors/index.js";

export class GetNotes {
  constructor(private noteRepo: INoteRepository) {}

  async execute(profileId: number): Promise<ProfileNote[]> {
    return this.noteRepo.findByProfile(profileId);
  }
}

export class AddNote {
  constructor(private noteRepo: INoteRepository) {}

  async execute(profileId: number, content: string, authorId: string, authorName: string): Promise<ProfileNote> {
    if (!content || content.trim().length === 0) {
      throw new ValidationError("Content is required");
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

  async execute(noteId: number, userId: string): Promise<void> {
    const note = await this.noteRepo.findById(noteId);
    if (!note) throw new NotFoundError("Note", noteId);

    if (!note.isAuthoredBy(userId)) {
      throw new ForbiddenError("You can only delete your own notes");
    }

    await this.noteRepo.delete(noteId);
  }
}
