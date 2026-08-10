import { Request, Response } from "express";
import { GetDashboardStats } from "../../usecases/analytics/GetDashboardStats.js";
import { DomainError } from "../../domain/errors/index.js";

export class AnalyticsController {
  constructor(private getDashboardStats: GetDashboardStats) {}

  dashboard = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const stats = await this.getDashboardStats.execute(tenantId);
      res.json(stats);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown): void {
    if (error instanceof DomainError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error("AnalyticsController error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
