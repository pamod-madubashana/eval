import { Request, Response } from "express";
import { ListOpenings, GetOpeningDetails } from "../../usecases/opening/ListOpenings.js";
import { DomainError } from "../../domain/errors/index.js";

export class VendorController {
  constructor(
    private listOpeningsUseCase: ListOpenings,
    private getOpeningDetailsUseCase: GetOpeningDetails
  ) {}

  listOpenings = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.listOpeningsUseCase.execute({ tenantId, page, limit });
      res.json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getOpeningDetailsHandler = async (req: any, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.user.tenant;
      const { id } = req.params;

      const opening = await this.getOpeningDetailsUseCase.execute(id, tenantId);
      res.json(opening);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown): void {
    if (error instanceof DomainError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error("VendorController error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
