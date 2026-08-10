import { ICandidateRepository } from "../../ports/repositories/ICandidateRepository.js";
import { IOpeningRepository } from "../../ports/repositories/IOpeningRepository.js";
import { IStorageService } from "../../ports/services/IStorageService.js";
import { CandidateProfile } from "../../domain/entities/index.js";
import { NotFoundError, ValidationError } from "../../domain/errors/index.js";

export interface SubmitProfileInput {
  openingId: string;
  s3Key: string;
  userId: string;
  tenantId: string;
}

export class SubmitProfile {
  constructor(
    private candidateRepo: ICandidateRepository,
    private openingRepo: IOpeningRepository,
    private storageService: IStorageService
  ) {}

  async execute(input: SubmitProfileInput): Promise<CandidateProfile> {
    const opening = await this.openingRepo.findByIdAndTenant(input.openingId, input.tenantId);
    if (!opening) {
      throw new NotFoundError("Opening", input.openingId);
    }

    const profile = await this.candidateRepo.create({
      openingId: input.openingId,
      s3Key: input.s3Key,
      uploadedBy: input.userId,
    }, input.tenantId);

    return profile;
  }
}

export interface GeneratePresignedUrlInput {
  openingId: string;
  tenantId: string;
  fileName: string;
  contentType: string;
}

export class GeneratePresignedUrl {
  constructor(
    private openingRepo: IOpeningRepository
  ) {}

  async execute(input: GeneratePresignedUrlInput): Promise<{ presignedUrl: string; s3Key: string }> {
    const opening = await this.openingRepo.findByIdAndTenant(input.openingId, input.tenantId);
    if (!opening) {
      throw new NotFoundError("Opening", input.openingId);
    }

    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const s3Client = new S3Client({
      region: process.env.S3_AWS_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      endpoint: process.env.S3_ENDPOINT || `https://s3.${process.env.S3_AWS_REGION}.amazonaws.com`,
      forcePathStyle: true,
    });

    const timestamp = Date.now();
    const s3Key = `${input.tenantId}/${input.openingId}/${timestamp}_${input.fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: input.contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return { presignedUrl, s3Key };
  }
}

export class DeleteProfile {
  constructor(
    private candidateRepo: ICandidateRepository,
    private openingRepo: IOpeningRepository
  ) {}

  async execute(openingId: string, profileId: number, tenantId: string, userId: string): Promise<void> {
    const opening = await this.openingRepo.findByIdAndTenant(openingId, tenantId);
    if (!opening) {
      throw new NotFoundError("Opening", openingId);
    }

    const profile = await this.candidateRepo.findByIdAndOpening(profileId, openingId);
    if (!profile) {
      throw new NotFoundError("Profile", profileId);
    }

    if (!profile.wasUploadedBy(userId)) {
      throw new ValidationError("You can only delete your own profiles");
    }

    await this.candidateRepo.softDelete(profileId, tenantId);
  }
}
