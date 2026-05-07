import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * Generuje kryptograficznie bezpieczny token weryfikacyjny (64 znaki hex).
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generuje JWT access token z krótkim czasem ważności (domyślnie 15 minut).
 */
export function generateAccessToken(payload: { id: string; email: string }): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Generuje JWT refresh token z dłuższym czasem ważności (domyślnie 7 dni).
 */
export function generateRefreshToken(payload: { id: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
}
