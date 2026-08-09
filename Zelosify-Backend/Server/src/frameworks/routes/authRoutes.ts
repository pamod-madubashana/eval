import { Router, RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { authController } from "../di/container.js";

const router = Router();

// ─── Auth Routes ─────────────────────────────────────────────────
router.post("/register", authController.register as any);
router.post("/verify-login", authController.verifyLogin as any);
router.post("/verify-totp", authController.verifyTOTP as any);
router.post("/logout", authenticateUser, authController.logout as any);

// ─── User Details ────────────────────────────────────────────────
router.get("/user", authenticateUser, authController.getUserDetails as any);

export default router;
