import express from "express";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

// Config
import { setupKeycloakConfig } from "../../config/keycloak/keycloak.js";
import connectPrisma from "../../utils/prisma/connectPrisma.js";

// New clean architecture routes
import authRoutes from "../routes/authRoutes.js";
import vendorRoutes from "../routes/vendorRoutes.js";
import hiringManagerRoutes from "../routes/hiringManagerRoutes.js";
import aiRoutes from "../routes/aiRoutes.js";
import analyticsRoutes from "../routes/analyticsRoutes.js";

// Legacy routes (not yet migrated)
import awsRouter from "../../routers/aws/awsRoute.js";
import vendorRequestRoutes from "../../routers/vendor/vendorRequestRoutes.js";

export async function createApp() {
  const app = express();

  const { keycloak, memoryStore } = await setupKeycloakConfig();
  await connectPrisma();

  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());

  app.use(
    cors({
      origin: ["http://localhost:3000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
      exposedHeaders: ["set-cookie"],
    })
  );

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "my-secret",
      resave: false,
      saveUninitialized: true,
      store: memoryStore,
    })
  );

  app.use(keycloak.middleware());

  // ─── Mount Routes ────────────────────────────────────────────
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/aws", awsRouter);
  app.use("/api/v1/vendor/requests", vendorRequestRoutes);
  app.use("/api/v1/vendor", vendorRoutes);
  app.use("/api/v1/hiring-manager", hiringManagerRoutes);
  app.use("/api/v1/ai", aiRoutes);
  app.use("/api/v1/analytics", analyticsRoutes);

  // Health check
  app.get("/", (_, res) => {
    res.send("Server Connected!");
  });

  // Global error handler
  app.use(
    (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error("Global error handler:", err);
      res.status(500).json({ error: "Internal Server Error", message: err.message });
    }
  );

  return app;
}
