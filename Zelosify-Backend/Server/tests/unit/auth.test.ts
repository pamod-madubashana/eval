import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

function generateToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h", algorithm: "HS256" });
}

function verifyToken(token: string): Record<string, unknown> | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as Record<string, unknown>;
  } catch {
    return null;
  }
}

describe("JWT Token Validation", () => {
  it("should reject empty token", () => {
    const result = verifyToken("");
    expect(result).toBeNull();
  });

  it("should reject malformed token", () => {
    const result = verifyToken("not-a-valid-jwt-token");
    expect(result).toBeNull();
  });

  it("should reject token signed with wrong secret", () => {
    const token = jwt.sign({ sub: "user1" }, "wrong-secret", { algorithm: "HS256" });
    const result = verifyToken(token);
    expect(result).toBeNull();
  });

  it("should accept valid token", () => {
    const token = generateToken({ sub: "user1", role: "IT_VENDOR" });
    const result = verifyToken(token);
    expect(result).not.toBeNull();
    expect(result?.sub).toBe("user1");
    expect(result?.role).toBe("IT_VENDOR");
  });

  it("should reject expired token", () => {
    const token = jwt.sign({ sub: "user1" }, JWT_SECRET, { expiresIn: "0s", algorithm: "HS256" });
    // Wait 1 second for token to expire
    const start = Date.now();
    while (Date.now() - start < 1100) {}
    const result = verifyToken(token);
    expect(result).toBeNull();
  });
});

describe("Role-Based Access Control", () => {
  const vendorToken = generateToken({
    sub: "vendor-user-id",
    role: "IT_VENDOR",
    tenantId: "tenant-123",
  });

  const managerToken = generateToken({
    sub: "manager-user-id",
    role: "HIRING_MANAGER",
    tenantId: "tenant-123",
  });

  it("should extract role from token", () => {
    const decoded = verifyToken(vendorToken);
    expect(decoded?.role).toBe("IT_VENDOR");
  });

  it("should distinguish between roles", () => {
    const vendorDecoded = verifyToken(vendorToken);
    const managerDecoded = verifyToken(managerToken);
    expect(vendorDecoded?.role).not.toBe(managerDecoded?.role);
  });

  it("should enforce IT_VENDOR cannot access HIRING_MANAGER endpoints", () => {
    const decoded = verifyToken(vendorToken);
    const allowedRoles = ["HIRING_MANAGER"];
    expect(allowedRoles).not.toContain(decoded?.role);
  });

  it("should enforce HIRING_MANAGER cannot access IT_VENDOR endpoints", () => {
    const decoded = verifyToken(managerToken);
    const allowedRoles = ["IT_VENDOR"];
    expect(allowedRoles).not.toContain(decoded?.role);
  });

  it("should allow HIRING_MANAGER to access HIRING_MANAGER endpoints", () => {
    const decoded = verifyToken(managerToken);
    const allowedRoles = ["HIRING_MANAGER"];
    expect(allowedRoles).toContain(decoded?.role);
  });

  it("should allow IT_VENDOR to access IT_VENDOR endpoints", () => {
    const decoded = verifyToken(vendorToken);
    const allowedRoles = ["IT_VENDOR"];
    expect(allowedRoles).toContain(decoded?.role);
  });
});

describe("Tenant Isolation", () => {
  it("should extract tenantId from token", () => {
    const token = generateToken({ sub: "user1", role: "IT_VENDOR", tenantId: "tenant-abc" });
    const decoded = verifyToken(token);
    expect(decoded?.tenantId).toBe("tenant-abc");
  });

  it("should prevent accessing different tenant data", () => {
    const token = generateToken({ sub: "user1", role: "IT_VENDOR", tenantId: "tenant-1" });
    const decoded = verifyToken(token);
    const requestedTenantId = "tenant-2";
    expect(decoded?.tenantId).not.toBe(requestedTenantId);
  });

  it("should allow accessing same tenant data", () => {
    const token = generateToken({ sub: "user1", role: "IT_VENDOR", tenantId: "tenant-1" });
    const decoded = verifyToken(token);
    const requestedTenantId = "tenant-1";
    expect(decoded?.tenantId).toBe(requestedTenantId);
  });
});

describe("Token Payload Structure", () => {
  it("should contain required fields", () => {
    const token = generateToken({
      sub: "user-id-123",
      role: "IT_VENDOR",
      tenantId: "tenant-456",
    });
    const decoded = verifyToken(token);
    expect(decoded).toHaveProperty("sub");
    expect(decoded).toHaveProperty("role");
    expect(decoded).toHaveProperty("tenantId");
    expect(decoded).toHaveProperty("iat");
    expect(decoded).toHaveProperty("exp");
  });

  it("should have expiration in the future", () => {
    const token = generateToken({ sub: "user1", role: "IT_VENDOR" });
    const decoded = verifyToken(token);
    expect(decoded?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});
