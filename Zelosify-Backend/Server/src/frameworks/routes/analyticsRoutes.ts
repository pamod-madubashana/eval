import { Router } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { analyticsController } from "../di/container.js";

const router = Router();

router.get(
  "/dashboard",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  analyticsController.dashboard
);

export default router;
