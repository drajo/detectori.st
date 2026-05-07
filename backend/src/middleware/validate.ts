import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // Przekaż ZodError do globalnego handlera błędów
      return next(result.error);
    }
    req.body = result.data;
    next();
  };
