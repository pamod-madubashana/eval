import { Request, Response } from "express";
import {
  runRecommendationAgent,
  runBatchRecommendations,
} from "../../services/ai/recommendationAgent.js";
import { IOpeningRepository } from "../../ports/repositories/IOpeningRepository.js";
import { DomainError, NotFoundError } from "../../domain/errors/index.js";

export class AIController {
  constructor(private openingRepo: IOpeningRepository) {}

  recommendBatch = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const { openingId } = req.params;

      const opening = await this.openingRepo.findByIdAndTenant(openingId, tenantId);
      if (!opening) {
        throw new NotFoundError("Opening", openingId);
      }

      const { results, stats } = await runBatchRecommendations(
        openingId,
        req.body.useLLM || false
      );

      res.json({
        message: "Recommendations generated successfully",
        openingId,
        stats,
        results,
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  recommendSingle = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const { openingId, profileId } = req.params;

      const opening = await this.openingRepo.findByIdAndTenant(openingId, tenantId);
      if (!opening) {
        throw new NotFoundError("Opening", openingId);
      }

      const result = await runRecommendationAgent({
        profileId: parseInt(profileId),
        openingId,
        useLLM: req.body.useLLM || false,
      });

      res.json({ message: "Recommendation generated successfully", result });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown): void {
    if (error instanceof DomainError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error("AIController error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
