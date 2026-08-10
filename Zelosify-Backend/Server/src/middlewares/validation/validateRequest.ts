import { Request, Response, NextFunction } from "express";
import { z } from "zod";

type RequestSource = "body" | "params" | "query";

export function validateRequest(
  schema: z.ZodSchema,
  source: RequestSource = "body"
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      res.status(400).json({
        message: "Validation failed",
        errors,
      });
      return;
    }

    // Replace with validated/sanitized data
    (req as any)[source] = result.data;
    next();
  };
}

export function validateParams(schema: z.ZodSchema) {
  return validateRequest(schema, "params");
}

export function validateBody(schema: z.ZodSchema) {
  return validateRequest(schema, "body");
}

export function validateQuery(schema: z.ZodSchema) {
  return validateRequest(schema, "query");
}
