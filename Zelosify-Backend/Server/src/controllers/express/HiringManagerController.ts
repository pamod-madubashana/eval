import { Request, Response } from "express";
import {
  ListOpenings,
  GetOpeningDetails,
} from "../../usecases/opening/ListOpenings.js";
import {
  ShortlistProfile,
  RejectProfile,
  UpdateProfileStatus,
} from "../../usecases/candidate/ShortlistProfile.js";
import { GetNotes, AddNote, DeleteNote } from "../../usecases/candidate/ManageNotes.js";
import { DomainError } from "../../domain/errors/index.js";
import { IStorageService } from "../../ports/services/IStorageService.js";
import { ICandidateRepository } from "../../ports/repositories/ICandidateRepository.js";

export class HiringManagerController {
  constructor(
    private listOpeningsUseCase: ListOpenings,
    private getOpeningDetailsUseCase: GetOpeningDetails,
    private shortlistProfileUseCase: ShortlistProfile,
    private rejectProfileUseCase: RejectProfile,
    private updateProfileStatusUseCase: UpdateProfileStatus,
    private getNotesUseCase: GetNotes,
    private addNoteUseCase: AddNote,
    private deleteNoteUseCase: DeleteNote,
    private candidateRepo: ICandidateRepository,
    private storageService: IStorageService
  ) {}

  listOpenings = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.listOpeningsUseCase.execute({ tenantId, page, limit });
      res.json({ openings: result.items, pagination: result.pagination });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getOpeningDetailsHandler = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const { id } = req.params;

      const opening = await this.getOpeningDetailsUseCase.execute(id, tenantId);
      res.json(opening);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  shortlist = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId, id: userId } = req.user;
      const { openingId, profileId } = req.params;

      const profile = await this.shortlistProfileUseCase.execute(
        openingId,
        parseInt(profileId),
        tenantId,
        userId
      );

      res.json({ message: "Profile shortlisted successfully", profile });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  reject = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId, id: userId } = req.user;
      const { openingId, profileId } = req.params;

      const profile = await this.rejectProfileUseCase.execute(
        openingId,
        parseInt(profileId),
        tenantId,
        userId
      );

      res.json({ message: "Profile rejected successfully", profile });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  updateStatus = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId, id: userId } = req.user;
      const { openingId, profileId } = req.params;
      const { status } = req.body;

      const profile = await this.updateProfileStatusUseCase.execute(
        openingId,
        parseInt(profileId),
        tenantId,
        status,
        userId
      );

      res.json({ message: "Profile status updated successfully", profile });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getNotesHandler = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const { profileId } = req.params;
      const notes = await this.getNotesUseCase.execute(parseInt(profileId), tenantId);
      res.json({ notes });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  addNoteHandler = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const { profileId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;
      const userName = req.user.firstName
        ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
        : req.user.username;

      const note = await this.addNoteUseCase.execute(
        parseInt(profileId),
        content,
        userId,
        userName,
        tenantId
      );

      res.status(201).json({ message: "Note added successfully", note });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  deleteNoteHandler = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const { noteId } = req.params;
      const userId = req.user.id;

      await this.deleteNoteUseCase.execute(parseInt(noteId), userId, tenantId);
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  viewProfile = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const { profileId } = req.params;
      const profile = await this.candidateRepo.findById(parseInt(profileId));
      if (!profile) {
        res.status(404).json({ message: "Profile not found" });
        return;
      }

      // Verify profile belongs to tenant
      const opening = await this.candidateRepo.findByIdAndOpening(parseInt(profileId), profile.openingId);
      if (!opening) {
        res.status(404).json({ message: "Profile not found" });
        return;
      }

      try {
        const url = await this.storageService.getObjectURL(profile.s3Key);
        res.json({ url });
      } catch {
        res.status(404).json({ message: "File not found in storage. The file may not have been uploaded yet." });
      }
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown): void {
    if (error instanceof DomainError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error("HiringManagerController error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
