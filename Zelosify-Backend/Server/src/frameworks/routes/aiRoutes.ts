import { Router } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { validateBody, validateParams } from "../../middlewares/validation/validateRequest.js";
import { timeoutMiddleware } from "../../middlewares/performance/timeoutMiddleware.js";
import { aiRateLimit } from "../../middlewares/performance/rateLimitMiddleware.js";
import {
  RecommendRequestSchema,
  OpeningIdParamSchema,
  ProfileIdParamSchema,
} from "../../services/ai/schema.js";
import { aiController } from "../di/container.js";

const router = Router();

router.post(
  "/recommend/:openingId",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  aiRateLimit,
  timeoutMiddleware(60000),
  validateParams(OpeningIdParamSchema),
  validateBody(RecommendRequestSchema),
  aiController.recommendBatch
);

router.post(
  "/recommend/:openingId/:profileId",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  aiRateLimit,
  timeoutMiddleware(60000),
  validateParams(OpeningIdParamSchema.extend({ profileId: ProfileIdParamSchema.shape.profileId })),
  validateBody(RecommendRequestSchema),
  aiController.recommendSingle
);

export default router;
