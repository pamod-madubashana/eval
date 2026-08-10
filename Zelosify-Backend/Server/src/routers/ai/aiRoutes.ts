import express from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import prisma from "../../config/prisma/prisma.js";
import {
  runRecommendationAgent,
  runBatchRecommendations,
} from "../../services/ai/recommendationAgent.js";

const router = express.Router();

/**
 * POST /ai/recommend/:openingId
 * Run recommendation agent for all submitted profiles in an opening
 */
router.post(
  "/recommend/:openingId",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  async (req: any, res) => {
    try {
      const { tenantId } = req.user.tenant;
      const { openingId } = req.params;

      const opening = await prisma.opening.findFirst({
        where: { id: openingId, tenantId },
      });

      if (!opening) {
        res.status(404).json({ message: "Opening not found" });
        return;
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
      console.error("Error running recommendation agent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /ai/recommend/:openingId/:profileId
 * Run recommendation agent for a single profile
 */
router.post(
  "/recommend/:openingId/:profileId",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  async (req: any, res) => {
    try {
      const { tenantId } = req.user.tenant;
      const { openingId, profileId } = req.params;

      const opening = await prisma.opening.findFirst({
        where: { id: openingId, tenantId },
      });

      if (!opening) {
        res.status(404).json({ message: "Opening not found" });
        return;
      }

      // Run recommendation for single profile
      const result = await runRecommendationAgent({
        profileId: parseInt(profileId),
        openingId,
        tenantId,
        useLLM: req.body.useLLM || false,
      });

      res.json({
        message: "Recommendation generated successfully",
        result,
      });
    } catch (error) {
      console.error("Error running recommendation agent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
