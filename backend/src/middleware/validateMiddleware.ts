import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";

export function validateBody(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors || error.message,
      });
    }
  };
}
