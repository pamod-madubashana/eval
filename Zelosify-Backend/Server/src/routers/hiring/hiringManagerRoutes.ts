import { Router, type RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { fetchData } from "../../controllers/controllers.js";
import prisma from "../../config/prisma/prisma.js";
import { notifyVendorStatusChange } from "../../services/notification/emailService.js";

const router = Router();

/**
 * =============================================================================
 * HIRING MANAGER ROUTES - VACANCY MANAGEMENT
 * =============================================================================
 */

/**
 * GET /api/v1/hiring-manager
 * @requires HIRING_MANAGER role
 */
router.get(
  "/",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  (async (req, res, next) => {
    try {
      await fetchData(req as any, res);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * GET /api/v1/hiring-manager/openings
 * List all openings for the hiring manager (tenant + ownership filtered)
 */
router.get(
  "/openings",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  async (req: any, res) => {
    try {
      const { tenantId } = req.user.tenant;
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [openings, total] = await Promise.all([
        prisma.opening.findMany({
          where: { tenantId, hiringManagerId: userId },
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
        prisma.opening.count({ where: { tenantId, hiringManagerId: userId } }),
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
 * GET /api/v1/hiring-manager/openings/:id
 * Get opening details with all profiles (ownership verified)
 */
router.get(
  "/openings/:id",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  async (req: any, res) => {
    try {
      const { tenantId } = req.user.tenant;
      const userId = req.user.id;
      const { id } = req.params;

      const opening = await prisma.opening.findFirst({
        where: { id, tenantId, hiringManagerId: userId },
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
 * PATCH /api/v1/hiring-manager/openings/:openingId/profiles/:profileId/shortlist
 * Shortlist a profile
 */
router.patch(
  "/openings/:openingId/profiles/:profileId/shortlist",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  async (req: any, res) => {
    try {
      const { tenantId, id: userId } = req.user;
      const { openingId, profileId } = req.params;

      const opening = await prisma.opening.findFirst({
        where: { id: openingId, tenantId, hiringManagerId: userId },
      });

      if (!opening) {
        return res.status(404).json({ message: "Opening not found" });
      }

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

      const updatedProfile = await prisma.hiringProfile.update({
        where: { id: parseInt(profileId) },
        data: {
          status: "SHORTLISTED",
          shortlistedBy: userId,
          shortlistedAt: new Date(),
        },
      });

      // Send notification to vendor
      try {
        const uploader = await prisma.user.findUnique({
          where: { id: profile.uploadedBy },
          select: { email: true, firstName: true, lastName: true, username: true },
        });
        if (uploader?.email) {
          const vendorName = uploader.firstName
            ? `${uploader.firstName} ${uploader.lastName || ""}`.trim()
            : uploader.username || "Vendor";
          await notifyVendorStatusChange(
            uploader.email,
            vendorName,
            opening.title,
            "shortlisted"
          );
        }
      } catch (emailError) {
        console.error("Failed to send shortlist notification:", emailError);
      }

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
router.patch(
  "/openings/:openingId/profiles/:profileId/reject",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  async (req: any, res) => {
    try {
      const { tenantId, id: userId } = req.user;
      const { openingId, profileId } = req.params;

      const opening = await prisma.opening.findFirst({
        where: { id: openingId, tenantId, hiringManagerId: userId },
      });

      if (!opening) {
        return res.status(404).json({ message: "Opening not found" });
      }

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

      const updatedProfile = await prisma.hiringProfile.update({
        where: { id: parseInt(profileId) },
        data: {
          status: "REJECTED",
          rejectedBy: userId,
          rejectedAt: new Date(),
        },
      });

      // Send notification to vendor
      try {
        const uploader = await prisma.user.findUnique({
          where: { id: profile.uploadedBy },
          select: { email: true, firstName: true, lastName: true, username: true },
        });
        if (uploader?.email) {
          const vendorName = uploader.firstName
            ? `${uploader.firstName} ${uploader.lastName || ""}`.trim()
            : uploader.username || "Vendor";
          await notifyVendorStatusChange(
            uploader.email,
            vendorName,
            opening.title,
            "rejected"
          );
        }
      } catch (emailError) {
        console.error("Failed to send rejection notification:", emailError);
      }

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
 * PATCH /api/v1/hiring-manager/openings/:openingId/profiles/:profileId/status
 * Update profile status
 */
router.patch(
  "/openings/:openingId/profiles/:profileId/status",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  async (req: any, res) => {
    try {
      const { tenantId, id: userId } = req.user;
      const { openingId, profileId } = req.params;
      const { status } = req.body;

      if (!["SUBMITTED", "SHORTLISTED", "REJECTED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const opening = await prisma.opening.findFirst({
        where: { id: openingId, tenantId, hiringManagerId: userId },
      });

      if (!opening) {
        return res.status(404).json({ message: "Opening not found" });
      }

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

/**
 * GET /api/v1/hiring-manager/profiles/:profileId/notes
 * Get all notes for a profile (ownership verified via opening)
 */
router.get(
  "/profiles/:profileId/notes",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  async (req: any, res) => {
    try {
      const { tenantId, id: userId } = req.user;
      const { profileId } = req.params;

      // Verify profile belongs to a hiring manager's opening
      const profile = await prisma.hiringProfile.findFirst({
        where: {
          id: parseInt(profileId),
          opening: { tenantId, hiringManagerId: userId },
          isDeleted: false,
        },
      });

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const notes = await prisma.profileNote.findMany({
        where: { profileId: parseInt(profileId) },
        orderBy: { createdAt: "desc" },
      });

      res.json({ notes });
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/v1/hiring-manager/profiles/:profileId/notes
 * Add a note to a profile (ownership verified via opening)
 */
router.post(
  "/profiles/:profileId/notes",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  async (req: any, res) => {
    try {
      const { tenantId, id: userId } = req.user;
      const { profileId } = req.params;
      const { content } = req.body;
      const userName = req.user.firstName
        ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
        : req.user.username;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Verify profile belongs to a hiring manager's opening
      const profile = await prisma.hiringProfile.findFirst({
        where: {
          id: parseInt(profileId),
          opening: { tenantId, hiringManagerId: userId },
          isDeleted: false,
        },
      });

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const note = await prisma.profileNote.create({
        data: {
          profileId: parseInt(profileId),
          content: content.trim(),
          authorId: userId,
          authorName: userName,
        },
      });

      res.status(201).json({ message: "Note added successfully", note });
    } catch (error) {
      console.error("Error adding note:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/v1/hiring-manager/profiles/:profileId/notes/:noteId
 * Delete a note (ownership verified via opening + author)
 */
router.delete(
  "/profiles/:profileId/notes/:noteId",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  async (req: any, res) => {
    try {
      const { tenantId, id: userId } = req.user;
      const { profileId, noteId } = req.params;

      // Verify profile belongs to a hiring manager's opening
      const profile = await prisma.hiringProfile.findFirst({
        where: {
          id: parseInt(profileId),
          opening: { tenantId, hiringManagerId: userId },
          isDeleted: false,
        },
      });

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const note = await prisma.profileNote.findFirst({
        where: { id: parseInt(noteId), profileId: parseInt(profileId) },
      });

      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Only allow author to delete their own notes
      if (note.authorId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only delete your own notes" });
      }

      await prisma.profileNote.delete({
        where: { id: parseInt(noteId) },
      });

      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
