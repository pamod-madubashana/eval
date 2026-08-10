import { ICandidateRepository } from "../../ports/repositories/ICandidateRepository.js";
import { IOpeningRepository } from "../../ports/repositories/IOpeningRepository.js";
import { IEmailService } from "../../ports/services/IEmailService.js";
import { IUserRepository } from "../../ports/repositories/IUserRepository.js";
import { CandidateProfile, ProfileStatus } from "../../domain/entities/index.js";
import { NotFoundError, ForbiddenError } from "../../domain/errors/index.js";

export class ShortlistProfile {
  constructor(
    private candidateRepo: ICandidateRepository,
    private openingRepo: IOpeningRepository,
    private userRepo: IUserRepository,
    private emailService: IEmailService
  ) {}

  async execute(
    openingId: string,
    profileId: number,
    tenantId: string,
    userId: string
  ): Promise<CandidateProfile> {
    const opening = await this.openingRepo.findByIdAndTenant(openingId, tenantId);
    if (!opening) throw new NotFoundError("Opening", openingId);
    if (opening.hiringManagerId !== userId) throw new ForbiddenError("You can only manage your own openings");

    const profile = await this.candidateRepo.findByIdAndOpening(profileId, openingId);
    if (!profile) throw new NotFoundError("Profile", profileId);

    const updated = await this.candidateRepo.updateStatus(
      profileId,
      ProfileStatus.SHORTLISTED,
      userId,
      tenantId
    );

    // Send notification to vendor (fire and forget)
    try {
      const uploader = await this.userRepo.findById(profile.props.uploadedBy);
      if (uploader?.email) {
        await this.emailService.notifyVendorStatusChange(
          uploader.email,
          uploader.displayName,
          opening.title,
          "shortlisted"
        );
      }
    } catch (emailError) {
      console.error("Failed to send shortlist notification:", emailError);
    }

    return updated;
  }
}

export class RejectProfile {
  constructor(
    private candidateRepo: ICandidateRepository,
    private openingRepo: IOpeningRepository,
    private userRepo: IUserRepository,
    private emailService: IEmailService
  ) {}

  async execute(
    openingId: string,
    profileId: number,
    tenantId: string,
    userId: string
  ): Promise<CandidateProfile> {
    const opening = await this.openingRepo.findByIdAndTenant(openingId, tenantId);
    if (!opening) throw new NotFoundError("Opening", openingId);
    if (opening.hiringManagerId !== userId) throw new ForbiddenError("You can only manage your own openings");

    const profile = await this.candidateRepo.findByIdAndOpening(profileId, openingId);
    if (!profile) throw new NotFoundError("Profile", profileId);

    const updated = await this.candidateRepo.updateStatus(
      profileId,
      ProfileStatus.REJECTED,
      userId,
      tenantId
    );

    // Send notification to vendor (fire and forget)
    try {
      const uploader = await this.userRepo.findById(profile.props.uploadedBy);
      if (uploader?.email) {
        await this.emailService.notifyVendorStatusChange(
          uploader.email,
          uploader.displayName,
          opening.title,
          "rejected"
        );
      }
    } catch (emailError) {
      console.error("Failed to send rejection notification:", emailError);
    }

    return updated;
  }
}

export class UpdateProfileStatus {
  constructor(
    private candidateRepo: ICandidateRepository,
    private openingRepo: IOpeningRepository
  ) {}

  async execute(
    openingId: string,
    profileId: number,
    tenantId: string,
    status: string,
    userId: string
  ): Promise<CandidateProfile> {
    if (!["SUBMITTED", "SHORTLISTED", "REJECTED"].includes(status)) {
      throw new NotFoundError("Invalid status", status);
    }

    const opening = await this.openingRepo.findByIdAndTenant(openingId, tenantId);
    if (!opening) throw new NotFoundError("Opening", openingId);
    if (opening.hiringManagerId !== userId) throw new ForbiddenError("You can only manage your own openings");

    const profile = await this.candidateRepo.findByIdAndOpening(profileId, openingId);
    if (!profile) throw new NotFoundError("Profile", profileId);

    return this.candidateRepo.updateStatus(
      profileId,
      status as ProfileStatus,
      userId,
      tenantId
    );
  }
}
