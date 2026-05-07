import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppError } from '../utils/errors';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // AppError — błędy domenowe
  if (err instanceof AppError) {
    const body: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.field !== undefined && { field: err.field }),
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // ZodError — validation errors
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const body: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: firstIssue?.message ?? 'Validation error.',
        ...(firstIssue?.path?.length && {
          field: String(firstIssue.path[firstIssue.path.length - 1]),
        }),
      },
    };
    res.status(400).json(body);
    return;
  }

  // PrismaClientKnownRequestError — błędy bazy danych
  if (err instanceof PrismaClientKnownRequestError) {
    // P2002 — unique constraint violation
    if (err.code === 'P2002') {
      const fields = err.meta?.target as string[] | undefined;
      const field = fields?.[0];
      const body: ErrorResponse = {
        error: {
          code: 'CONFLICT',
          message: 'A resource with the provided data already exists.',
          ...(field !== undefined && { field }),
        },
      };
      res.status(409).json(body);
      return;
    }

    // P2025 — record not found
    if (err.code === 'P2025') {
      const body: ErrorResponse = {
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found.',
        },
      };
      res.status(404).json(body);
      return;
    }
  }

  // Other errors — 500
  console.error(err);
  const body: ErrorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred.',
    },
  };
  res.status(500).json(body);
};
