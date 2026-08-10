import { Router } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { validateBody, validateParams } from "../../middlewares/validation/validateRequest.js";
import {
  NoteRequestSchema,
  StatusUpdateRequestSchema,
} from "../../services/ai/schema.js";
import { hiringManagerController } from "../di/container.js";

const router = Router();

// ─── Opening Routes ──────────────────────────────────────────────
router.get(
  "/",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  hiringManagerController.listOpenings
);

router.get(
  "/openings",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  hiringManagerController.listOpenings
);

router.get(
  "/openings/:id",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  hiringManagerController.getOpeningDetailsHandler
);

// ─── Profile View Route ──────────────────────────────────────────
router.get(
  "/profiles/:profileId/view",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  hiringManagerController.viewProfile
);

// ─── Profile Status Routes ───────────────────────────────────────
router.patch(
  "/openings/:openingId/profiles/:profileId/shortlist",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  hiringManagerController.shortlist
);

router.patch(
  "/openings/:openingId/profiles/:profileId/reject",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  hiringManagerController.reject
);

router.patch(
  "/openings/:openingId/profiles/:profileId/status",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  validateBody(StatusUpdateRequestSchema),
  hiringManagerController.updateStatus
);

// ─── Notes Routes ────────────────────────────────────────────────
router.get(
  "/profiles/:profileId/notes",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  hiringManagerController.getNotesHandler
);

router.post(
  "/profiles/:profileId/notes",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  validateBody(NoteRequestSchema),
  hiringManagerController.addNoteHandler
);

router.delete(
  "/profiles/:profileId/notes/:noteId",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  hiringManagerController.deleteNoteHandler
);

export default router;
