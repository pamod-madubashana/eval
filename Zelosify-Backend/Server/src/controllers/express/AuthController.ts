import { Request, Response } from "express";
import { IUserRepository } from "../../ports/repositories/IUserRepository.js";
import { ITenantRepository } from "../../ports/repositories/ITenantRepository.js";
import { IAuthService } from "../../ports/services/IAuthService.js";
import { DomainError, NotFoundError, UnauthorizedError } from "../../domain/errors/index.js";
import QRCode from "qrcode";
import { authenticator } from "otplib";
import jwt from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";

const REALM_NAME = process.env.KEYCLOAK_REALM || "Zelosify";

export class AuthController {
  constructor(
    private userRepo: IUserRepository,
    private authService: IAuthService,
    private tenantRepo: ITenantRepository
  ) {}

  verifyLogin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { usernameOrEmail, password } = req.body;

      if (!usernameOrEmail || !password) {
        res.status(400).json({ message: "Username/Email and password are required" });
        return;
      }

      const user = await this.userRepo.findByUsernameOrEmail(usernameOrEmail);
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      if (user.provider !== "KEYCLOAK") {
        res.status(400).json({ message: "This login method is for Keycloak users only" });
        return;
      }

      try {
        const tokens = await this.authService.login(user.email, password);

        // Bypass TOTP for seeded/development users
        if (user.username && (/^user\d+$/.test(user.username) || process.env.NODE_ENV === "development")) {
          await this.userRepo.updateTokens(user.id, tokens.accessToken, tokens.refreshToken);

          res.cookie("access_token", tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 4 * 3600 * 1000,
            path: "/",
          });

          res.cookie("refresh_token", tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: "/",
          });

          res.json({
            success: true,
            message: "Authentication successful",
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              phoneNumber: user.phoneNumber,
              role: user.role,
              department: user.department,
              provider: user.provider,
              tenantId: user.tenantId,
            },
            redirectTo: "/user",
          });
          return;
        }

        // Normal flow: generate temp token for TOTP
        const { generateTempToken } = await import("../../utils/jwt/generateTempToken.js");
        const tempToken = generateTempToken(user.id, tokens.refreshToken);

        res.cookie("temp_token", tempToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 5 * 60 * 1000,
          path: "/",
        });

        res.json({ message: "Login verified. Please enter your TOTP code." });
      } catch (error: any) {
        console.error("Keycloak authentication failed:", error.response?.data || error.message);
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error verifying login:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  verifyTOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const { totp } = req.body;
      const tempToken = req.cookies.temp_token;

      if (!tempToken || !totp) {
        res.status(400).json({ message: "Temp token and TOTP are required" });
        return;
      }

      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET!) as JwtPayload;
      } catch (error) {
        res.status(401).json({ message: "Invalid or expired temp token" });
        return;
      }

      const { userId, refreshToken } = decoded;
      const user = await this.userRepo.findById(userId);
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      // Verify TOTP
      const isValidTOTP = authenticator.verify({ token: totp, secret: (user as any).totpSecret! });
      if (!isValidTOTP) {
        res.status(401).json({ message: "Invalid TOTP code" });
        return;
      }

      const tokens = await this.authService.getTokensFromRefresh(refreshToken);

      res.cookie("access_token", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 4 * 3600 * 1000,
        path: "/",
      });

      res.cookie("refresh_token", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      });

      res.clearCookie("temp_token");
      res.json({
        message: "TOTP verified successfully. Login successful.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          provider: user.provider,
        },
      });
    } catch (error) {
      console.error("Error verifying TOTP:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password, firstName, lastName, phoneNumber, tenantId, department, role } = req.body;

      if (!username || !email || !password || !firstName || !lastName || !phoneNumber || !tenantId || !department || !role) {
        res.status(400).json({ error: "All fields are required." });
        return;
      }

      const exists = await this.userRepo.existsByUsernameOrEmail(username, email);
      if (exists) {
        res.status(400).json({ message: "User already exists." });
        return;
      }

      const totpSecret = authenticator.generateSecret();
      const adminToken = await this.authService.getAdminToken();

      // Create user in Keycloak
      const keycloakUserId = await this.authService.createUser({
        username,
        email,
        firstName,
        lastName: lastName || "",
        enabled: true,
        credentials: [{ type: "password", value: password, temporary: false }],
      });

      // Assign role in Keycloak
      await this.authService.assignRole(keycloakUserId, role, adminToken);

      // Create user in database
      const user = await this.userRepo.create({
        username,
        email,
        firstName,
        lastName,
        phoneNumber,
        department,
        role,
        tenantId,
        externalId: keycloakUserId,
        totpSecret,
        provider: "KEYCLOAK",
        creator: username,
      });

      // Get initial tokens
      const tokens = await this.authService.login(email, password);

      res.cookie("access_token", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600 * 1000,
        path: "/",
      });

      res.cookie("refresh_token", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      });

      const otpAuthUrl = authenticator.keyuri(email, REALM_NAME, totpSecret);
      const qrCode = await QRCode.toDataURL(otpAuthUrl);

      res.status(201).json({
        message: "User registered successfully. Scan the QR Code to configure TOTP.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          department: user.department,
          role: user.role,
          tenantId: user.tenantId,
          provider: user.provider,
        },
        qrCode,
        otpAuthUrl,
        expiresIn: 3600,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error registering user" });
    }
  };

  logout = async (req: any, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refresh_token || req.headers.authorization?.split(" ")[1];
      if (!refreshToken) {
        res.status(400).json({ message: "No refresh token found, already logged out" });
        return;
      }

      if (req.user?.provider === "KEYCLOAK") {
        try {
          await this.authService.logout(refreshToken);
        } catch (error: any) {
          console.error("Keycloak logout failed:", error.response?.data || error.message);
          res.status(500).json({ message: "Error logging out of Keycloak" });
          return;
        }
      }

      res.clearCookie("access_token", { httpOnly: true, secure: true, sameSite: "strict", path: "/" });
      res.clearCookie("refresh_token", { httpOnly: true, secure: true, sameSite: "strict", path: "/" });
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Error logging out" });
    }
  };

  getUserDetails = async (req: any, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const user = await this.userRepo.findById(userId);
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      const tenant = user.tenantId
        ? await this.tenantRepo.findById(user.tenantId)
        : null;

      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        tenant: tenant ? { tenantId: tenant.tenantId, companyName: tenant.companyName } : null,
      });
    } catch (error) {
      console.error("Error during user retrieval:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}
