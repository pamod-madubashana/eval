import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── Validation Logic (extracted from middleware for testing) ─────

function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: { field: string; message: string }[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issues = (result.error as any).issues || result.error.errors || [];
  return {
    success: false,
    errors: issues.map((e: any) => ({
      field: e.path?.join(".") || "",
      message: e.message || "",
    })),
  };
}

// ─── Schemas (mirroring schema.ts) ───────────────────────────────

const RecommendRequestSchema = z.object({
  useLLM: z.boolean().optional().default(false),
});

const PresignRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
});

const UploadRequestSchema = z.object({
  s3Key: z.string().min(1).max(500),
});

const NoteRequestSchema = z.object({
  content: z.string().min(1).max(2000),
});

const StatusUpdateRequestSchema = z.object({
  status: z.enum(["SUBMITTED", "SHORTLISTED", "REJECTED"]),
});

const OpeningIdParamSchema = z.object({
  openingId: z.string().uuid(),
});

const ProfileIdParamSchema = z.object({
  profileId: z.string().regex(/^\d+$/, "Profile ID must be a number"),
});

// ─── Tests ───────────────────────────────────────────────────────

describe("Request Validation Schemas", () => {
  describe("RecommendRequestSchema", () => {
    it("should accept empty body (useLLM defaults to false)", () => {
      const result = validateData(RecommendRequestSchema, {});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.useLLM).toBe(false);
    });

    it("should accept useLLM: true", () => {
      const result = validateData(RecommendRequestSchema, { useLLM: true });
      expect(result.success).toBe(true);
    });

    it("should reject non-boolean useLLM", () => {
      const result = validateData(RecommendRequestSchema, { useLLM: "yes" });
      expect(result.success).toBe(false);
    });
  });

  describe("PresignRequestSchema", () => {
    it("should accept valid presign request", () => {
      const result = validateData(PresignRequestSchema, {
        fileName: "resume.pdf",
        contentType: "application/pdf",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty fileName", () => {
      const result = validateData(PresignRequestSchema, {
        fileName: "",
        contentType: "application/pdf",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing contentType", () => {
      const result = validateData(PresignRequestSchema, {
        fileName: "resume.pdf",
      });
      expect(result.success).toBe(false);
    });

    it("should reject fileName > 255 chars", () => {
      const result = validateData(PresignRequestSchema, {
        fileName: "a".repeat(256),
        contentType: "application/pdf",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UploadRequestSchema", () => {
    it("should accept valid s3Key", () => {
      const result = validateData(UploadRequestSchema, {
        s3Key: "tenant-1/opening-1/1234567890_resume.pdf",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty s3Key", () => {
      const result = validateData(UploadRequestSchema, { s3Key: "" });
      expect(result.success).toBe(false);
    });

    it("should reject s3Key > 500 chars", () => {
      const result = validateData(UploadRequestSchema, {
        s3Key: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("NoteRequestSchema", () => {
    it("should accept valid note content", () => {
      const result = validateData(NoteRequestSchema, {
        content: "Great candidate, strong technical skills",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty content", () => {
      const result = validateData(NoteRequestSchema, { content: "" });
      expect(result.success).toBe(false);
    });

    it("should reject content > 2000 chars", () => {
      const result = validateData(NoteRequestSchema, {
        content: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("should accept content at exactly 2000 chars", () => {
      const result = validateData(NoteRequestSchema, {
        content: "a".repeat(2000),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("StatusUpdateRequestSchema", () => {
    it("should accept SUBMITTED", () => {
      const result = validateData(StatusUpdateRequestSchema, { status: "SUBMITTED" });
      expect(result.success).toBe(true);
    });

    it("should accept SHORTLISTED", () => {
      const result = validateData(StatusUpdateRequestSchema, { status: "SHORTLISTED" });
      expect(result.success).toBe(true);
    });

    it("should accept REJECTED", () => {
      const result = validateData(StatusUpdateRequestSchema, { status: "REJECTED" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = validateData(StatusUpdateRequestSchema, { status: "PENDING" });
      expect(result.success).toBe(false);
    });
  });

  describe("OpeningIdParamSchema", () => {
    it("should accept valid UUID", () => {
      const result = validateData(OpeningIdParamSchema, {
        openingId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject non-UUID string", () => {
      const result = validateData(OpeningIdParamSchema, {
        openingId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      const result = validateData(OpeningIdParamSchema, { openingId: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("ProfileIdParamSchema", () => {
    it("should accept numeric string", () => {
      const result = validateData(ProfileIdParamSchema, { profileId: "123" });
      expect(result.success).toBe(true);
    });

    it("should reject non-numeric string", () => {
      const result = validateData(ProfileIdParamSchema, { profileId: "abc" });
      expect(result.success).toBe(false);
    });

    it("should reject UUID format", () => {
      const result = validateData(ProfileIdParamSchema, {
        profileId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });
  });
});
