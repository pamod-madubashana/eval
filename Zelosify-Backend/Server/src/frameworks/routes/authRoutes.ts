import { Router, RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { timeoutMiddleware } from "../../middlewares/performance/timeoutMiddleware.js";
import { authRateLimit } from "../../middlewares/performance/rateLimitMiddleware.js";
import { authController } from "../di/container.js";

const router = Router();

// ─── Auth Routes ─────────────────────────────────────────────────
router.post("/register", authRateLimit, timeoutMiddleware(15000), authController.register as any);
router.post("/verify-login", authRateLimit, timeoutMiddleware(15000), authController.verifyLogin as any);
router.post("/verify-totp", authRateLimit, timeoutMiddleware(15000), authController.verifyTOTP as any);
router.post("/logout", authenticateUser, authController.logout as any);

// ─── User Details ────────────────────────────────────────────────
router.get("/user", authenticateUser, authController.getUserDetails as any);

export default router;
