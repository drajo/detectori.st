import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Errors } from '../utils/errors';

interface AccessTokenPayload {
  id: string;
  email: string;
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(Errors.unauthorized());
  }

  const token = authHeader.slice(7); // usuń "Bearer "

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    req.user = {
      id: payload.id,
      email: payload.email,
    };
    next();
  } catch {
    return next(Errors.unauthorized());
  }
};
