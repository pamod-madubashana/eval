import { Request, Response } from "express";
import {
  SubmitProfile,
  GeneratePresignedUrl,
  DeleteProfile,
} from "../../usecases/candidate/SubmitProfile.js";
import { DomainError } from "../../domain/errors/index.js";
import { runAgent } from "../../services/ai/recommendationAgent.js";
import { logger } from "../../services/ai/logger.js";

export class ProfileController {
  constructor(
    private submitProfile: SubmitProfile,
    private generatePresignedUrl: GeneratePresignedUrl,
    private deleteProfile: DeleteProfile
  ) {}

  presign = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const { id: openingId } = req.params;
      const { fileName, contentType } = req.body;

      if (!fileName || !contentType) {
        res.status(400).json({ message: "fileName and contentType are required" });
        return;
      }

      const result = await this.generatePresignedUrl.execute({
        openingId,
        tenantId,
        fileName,
        contentType,
      });
      res.json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  upload = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const userId = req.user.id;
      const { id: openingId } = req.params;
      const { s3Key } = req.body;

      if (!s3Key) {
        res.status(400).json({ message: "s3Key is required" });
        return;
      }

      const profile = await this.submitProfile.execute({
        openingId,
        s3Key,
        userId,
        tenantId,
      });

      // Auto-trigger recommendation agent (fire and forget)
      runAgent({ profileId: profile.id, openingId, tenantId, useLLM: false })
        .then((result) => {
          logger.info("Auto-recommendation complete", "vendor-upload", {
            profileId: profile.id,
            score: result.score,
            latencyMs: result.latencyMs,
          });
        })
        .catch((err) => {
          logger.error("Auto-recommendation failed", "vendor-upload", err, {
            profileId: profile.id,
          });
        });

      res.status(201).json({
        message: "Profile submitted successfully",
        profile,
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  delete = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId, id: userId } = req.user;
      const { openingId, profileId } = req.params;

      await this.deleteProfile.execute(
        openingId,
        parseInt(profileId),
        tenantId,
        userId
      );

      res.json({ message: "Profile deleted successfully" });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown): void {
    if (error instanceof DomainError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error("ProfileController error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
