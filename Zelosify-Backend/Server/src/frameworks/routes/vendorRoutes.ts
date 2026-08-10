import { Router } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { validateBody } from "../../middlewares/validation/validateRequest.js";
import {
  PresignRequestSchema,
  UploadRequestSchema,
} from "../../services/ai/schema.js";
import { vendorController, profileController } from "../di/container.js";

const router = Router();

// ─── Vendor Opening Routes ───────────────────────────────────────
router.get(
  "/openings",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
  vendorController.listOpenings
);

router.get(
  "/openings/:id",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
  vendorController.getOpeningDetailsHandler
);

// ─── Profile Routes ──────────────────────────────────────────────
router.post(
  "/openings/:id/profiles/presign",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
  validateBody(PresignRequestSchema),
  profileController.presign
);

router.post(
  "/openings/:id/profiles/upload",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
  validateBody(UploadRequestSchema),
  profileController.upload
);

router.delete(
  "/openings/:openingId/profiles/:profileId",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
  profileController.delete
);

export default router;
