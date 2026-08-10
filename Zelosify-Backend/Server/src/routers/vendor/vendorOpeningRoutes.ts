import express from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import prisma from "../../config/prisma/prisma.js";
import { runAgent } from "../../services/ai/recommendationAgent.js";
import { logger } from "../../services/ai/logger.js";

const router = express.Router();

/**
 * GET /vendor/openings
 * Fetch all openings for the vendor's tenant (paginated)
 */
router.get(
  "/",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
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
              select: { id: true },
            },
          },
          orderBy: { postedDate: "desc" },
          skip,
          take: limit,
        }),
        prisma.opening.count({ where: { tenantId } }),
      ]);

      const openingsWithCount = openings.map((o) => ({
        ...o,
        profilesCount: o.hiringProfiles.length,
        hiringProfiles: undefined,
      }));

      res.json({
        openings: openingsWithCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching vendor openings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /vendor/openings/:id
 * Fetch opening details with profiles, hiring manager name, and count
 */
router.get(
  "/:id",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
  async (req: any, res) => {
    try {
      const { tenantId } = req.user.tenant;
      const { id } = req.params;

      const opening = await prisma.opening.findFirst({
        where: { id, tenantId },
        include: {
          hiringProfiles: {
            where: { isDeleted: false, uploadedBy: req.user.id },
            orderBy: { submittedAt: "desc" },
          },
          tenant: {
            select: {
              users: {
                where: { id: undefined },
                select: { id: true, firstName: true, lastName: true, username: true },
              },
            },
          },
        },
      });

      if (!opening) {
        return res.status(404).json({ message: "Opening not found" });
      }

      // Resolve hiring manager name
      const hiringManager = await prisma.user.findUnique({
        where: { id: opening.hiringManagerId },
        select: { firstName: true, lastName: true, username: true },
      });

      const hiringManagerName = hiringManager
        ? hiringManager.firstName
          ? `${hiringManager.firstName} ${hiringManager.lastName || ""}`.trim()
          : hiringManager.username || "Unknown"
        : "Unknown";

      // Get total profiles count for this opening (not just vendor's)
      const totalProfilesCount = await prisma.hiringProfile.count({
        where: { openingId: id, isDeleted: false },
      });

      res.json({
        ...opening,
        hiringManagerName,
        profilesCount: totalProfilesCount,
        tenant: undefined,
      });
    } catch (error) {
      console.error("Error fetching opening details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /vendor/openings/:id/profiles/presign
 * Generate presigned URL for S3 upload
 */
router.post(
  "/:id/profiles/presign",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
  async (req: any, res) => {
    try {
      const { tenantId } = req.user.tenant;
      const userId = req.user.id;
      const { id: openingId } = req.params;
      const { fileName, contentType } = req.body;

      if (!fileName || !contentType) {
        return res
          .status(400)
          .json({ message: "fileName and contentType are required" });
      }

      // Verify opening exists and belongs to tenant
      const opening = await prisma.opening.findFirst({
        where: { id: openingId, tenantId },
      });

      if (!opening) {
        return res.status(404).json({ message: "Opening not found" });
      }

      // Generate S3 key
      const timestamp = Date.now();
      const s3Key = `${tenantId}/${openingId}/${timestamp}_${fileName}`;

      // Import S3 client
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

      const s3Client = new S3Client({
        region: process.env.S3_AWS_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        endpoint: process.env.S3_ENDPOINT || `https://s3.${process.env.S3_AWS_REGION}.amazonaws.com`,
        forcePathStyle: true,
      });

      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });

      res.json({ presignedUrl, s3Key });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /vendor/openings/:id/profiles/upload
 * Submit a profile (after direct S3 upload from frontend)
 */
router.post(
  "/:id/profiles/upload",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
  async (req: any, res) => {
    try {
      const { tenantId } = req.user.tenant;
      const userId = req.user.id;
      const { id: openingId } = req.params;
      const { s3Key } = req.body;

      if (!s3Key) {
        return res.status(400).json({ message: "s3Key is required" });
      }

      // Verify opening exists and belongs to tenant
      const opening = await prisma.opening.findFirst({
        where: { id: openingId, tenantId },
      });

      if (!opening) {
        return res.status(404).json({ message: "Opening not found" });
      }

      // Create profile record in transaction
      const profile = await prisma.$transaction(async (tx) => {
        const newProfile = await tx.hiringProfile.create({
          data: {
            openingId,
            s3Key,
            uploadedBy: userId,
          },
        });

        return newProfile;
      });

      // Auto-trigger recommendation agent
      runAgent({ profileId: profile.id, openingId, useLLM: false })
        .then((result) => {
          logger.info("Auto-recommendation complete", "vendor-upload", {
            profileId: profile.id,
            score: result.score,
            latencyMs: result.latencyMs,
          });
        })
        .catch((err) => {
          logger.error("Auto-recommendation failed", "vendor-upload", err, {
            profileId: profile.id,
          });
        });

      res.status(201).json({
        message: "Profile submitted successfully",
        profile,
      });
    } catch (error) {
      console.error("Error submitting profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * DELETE /vendor/openings/:openingId/profiles/:profileId
 * Soft delete a profile
 */
router.delete(
  "/:openingId/profiles/:profileId",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
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

      // Verify profile exists and was uploaded by this user
      const profile = await prisma.hiringProfile.findFirst({
        where: {
          id: parseInt(profileId),
          openingId,
          uploadedBy: userId,
          isDeleted: false,
        },
      });

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Soft delete
      await prisma.hiringProfile.update({
        where: { id: parseInt(profileId) },
        data: { isDeleted: true },
      });

      res.json({ message: "Profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
