import express from "express";
import managerOpeningRoutes from "./managerOpeningRoutes.js";

const router = express.Router();

/**
 * @route /manager/openings
 */
router.use("/openings", managerOpeningRoutes);

export default router;
