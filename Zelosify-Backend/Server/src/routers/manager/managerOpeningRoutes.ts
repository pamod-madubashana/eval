import express from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import prisma from "../../config/prisma/prisma.js";

const router = express.Router();

/**
 * GET /manager/openings
 * List all openings for the hiring manager's tenant
 */
router.get(
  "/",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  async (req: any, res) => {
    try {
      const { tenantId } = req.user.tenant;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [openings, total] = await Promise.all([
        prisma.opening.findMany({
          where: { tenantId },
          include: {
            hiringProfiles: {
              where: { isDeleted: false },
              select: { id: true, status: true },
            },
          },
          orderBy: { postedDate: "desc" },
          skip,
          take: limit,
        }),
        prisma.opening.count({ where: { tenantId } }),
      ]);

      const openingsWithStats = openings.map((o) => ({
        ...o,
        stats: {
          totalProfiles: o.hiringProfiles.length,
          submitted: o.hiringProfiles.filter((p) => p.status === "SUBMITTED")
            .length,
          shortlisted: o.hiringProfiles.filter(
            (p) => p.status === "SHORTLISTED"
          ).length,
          rejected: o.hiringProfiles.filter((p) => p.status === "REJECTED")
            .length,
        },
        hiringProfiles: undefined,
      }));

      res.json({
        openings: openingsWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching manager openings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /manager/openings/:id
 * Get opening details with all profiles
 */
router.get(
  "/:id",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  async (req: any, res) => {
    try {
      const { tenantId } = req.user.tenant;
      const { id } = req.params;

      const opening = await prisma.opening.findFirst({
        where: { id, tenantId },
        include: {
          hiringProfiles: {
            where: { isDeleted: false },
            orderBy: { submittedAt: "desc" },
          },
        },
      });

      if (!opening) {
        return res.status(404).json({ message: "Opening not found" });
      }

      res.json(opening);
    } catch (error) {
      console.error("Error fetching opening details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /manager/openings/:openingId/profiles/:profileId/shortlist
 * Shortlist a profile
 */
router.patch(
  "/:openingId/profiles/:profileId/shortlist",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  async (req: any, res) => {
    try {
      const { tenantId, id: userId } = req.user;
      const { openingId, profileId } = req.params;

      // Verify opening exists and belongs to tenant
      const opening = await prisma.opening.findFirst({
        where: { id: openingId, tenantId },
      });

      if (!opening) {
        return res.status(404).json({ message: "Opening not found" });
      }

      // Verify profile exists
      const profile = await prisma.hiringProfile.findFirst({
        where: {
          id: parseInt(profileId),
          openingId,
          isDeleted: false,
        },
      });

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Update profile status
      const updatedProfile = await prisma.hiringProfile.update({
        where: { id: parseInt(profileId) },
        data: {
          status: "SHORTLISTED",
          shortlistedBy: userId,
          shortlistedAt: new Date(),
        },
      });

      res.json({
        message: "Profile shortlisted successfully",
        profile: updatedProfile,
      });
    } catch (error) {
      console.error("Error shortlisting profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /manager/openings/:openingId/profiles/:profileId/reject
 * Reject a profile
 */
router.patch(
  "/:openingId/profiles/:profileId/reject",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  async (req: any, res) => {
    try {
      const { tenantId, id: userId } = req.user;
      const { openingId, profileId } = req.params;

      // Verify opening exists and belongs to tenant
      const opening = await prisma.opening.findFirst({
        where: { id: openingId, tenantId },
      });

      if (!opening) {
        return res.status(404).json({ message: "Opening not found" });
      }

      // Verify profile exists
      const profile = await prisma.hiringProfile.findFirst({
        where: {
          id: parseInt(profileId),
          openingId,
          isDeleted: false,
        },
      });

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Update profile status
      const updatedProfile = await prisma.hiringProfile.update({
        where: { id: parseInt(profileId) },
        data: {
          status: "REJECTED",
          rejectedBy: userId,
          rejectedAt: new Date(),
        },
      });

      res.json({
        message: "Profile rejected successfully",
        profile: updatedProfile,
      });
    } catch (error) {
      console.error("Error rejecting profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /manager/openings/:openingId/profiles/:profileId/status
 * Update profile status (bulk or individual)
 */
router.patch(
  "/:openingId/profiles/:profileId/status",
  authenticateUser,
  authorizeRole("HIRING_MANAGER"),
  async (req: any, res) => {
    try {
      const { tenantId, id: userId } = req.user;
      const { openingId, profileId } = req.params;
      const { status } = req.body;

      if (!["SUBMITTED", "SHORTLISTED", "REJECTED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Verify opening exists and belongs to tenant
      const opening = await prisma.opening.findFirst({
        where: { id: openingId, tenantId },
      });

      if (!opening) {
        return res.status(404).json({ message: "Opening not found" });
      }

      // Verify profile exists
      const profile = await prisma.hiringProfile.findFirst({
        where: {
          id: parseInt(profileId),
          openingId,
          isDeleted: false,
        },
      });

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Update profile status
      const updateData: any = { status };

      if (status === "SHORTLISTED") {
        updateData.shortlistedBy = userId;
        updateData.shortlistedAt = new Date();
      } else if (status === "REJECTED") {
        updateData.rejectedBy = userId;
        updateData.rejectedAt = new Date();
      }

      const updatedProfile = await prisma.hiringProfile.update({
        where: { id: parseInt(profileId) },
        data: updateData,
      });

      res.json({
        message: "Profile status updated successfully",
        profile: updatedProfile,
      });
    } catch (error) {
      console.error("Error updating profile status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
