import { Router } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { aiController } from "../di/container.js";

const router = Router();

router.post(
  "/recommend/:openingId",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  aiController.recommendBatch
);

router.post(
  "/recommend/:openingId/:profileId",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  aiController.recommendSingle
);

export default router;
