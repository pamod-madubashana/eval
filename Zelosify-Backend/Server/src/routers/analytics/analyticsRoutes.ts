import express from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import prisma from "../../config/prisma/prisma.js";

const router = express.Router();

/**
 * GET /api/v1/analytics/dashboard
 * Get aggregated dashboard statistics
 */
router.get(
  "/dashboard",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  async (req: any, res) => {
    try {
      const { tenantId } = req.user.tenant;

      // Get opening counts by status
      const openingsByStatus = await prisma.opening.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { id: true },
      });

      // Get profile counts by status for this tenant's openings
      const profilesByStatus = await prisma.hiringProfile.groupBy({
        by: ["status"],
        where: {
          opening: { tenantId },
          isDeleted: false,
        },
        _count: { id: true },
      });

      // Get total counts
      const totalOpenings = await prisma.opening.count({
        where: { tenantId },
      });

      const totalProfiles = await prisma.hiringProfile.count({
        where: {
          opening: { tenantId },
          isDeleted: false,
        },
      });

      // Get AI recommendation stats
      const recommendationStats = await prisma.hiringProfile.aggregate({
        where: {
          opening: { tenantId },
          isDeleted: false,
          recommended: true,
        },
        _avg: { recommendationScore: true },
        _count: { id: true },
      });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentProfiles = await prisma.hiringProfile.count({
        where: {
          opening: { tenantId },
          isDeleted: false,
          submittedAt: { gte: sevenDaysAgo },
        },
      });

      // Format response
      const stats = {
        openings: {
          total: totalOpenings,
          byStatus: openingsByStatus.reduce((acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
          }, {} as Record<string, number>),
        },
        profiles: {
          total: totalProfiles,
          byStatus: profilesByStatus.reduce((acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
          }, {} as Record<string, number>),
          recent: recentProfiles,
        },
        recommendations: {
          total: recommendationStats._count.id,
          avgScore: recommendationStats._avg.recommendationScore || 0,
        },
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
