import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { Errors } from '../utils/errors';

interface SiteVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export function verifyRecaptcha(expectedAction: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!env.RECAPTCHA_SECRET_KEY) {
      return next();
    }

    const token = (req.body as { recaptchaToken?: unknown }).recaptchaToken;
    if (typeof token !== 'string' || token.length === 0) {
      return next(Errors.recaptchaFailed());
    }

    try {
      const params = new URLSearchParams({
        secret: env.RECAPTCHA_SECRET_KEY,
        response: token,
        remoteip: req.ip ?? '',
      });
      const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });
      const data = (await r.json()) as SiteVerifyResponse;

      const scoreOk = (data.score ?? 0) >= env.RECAPTCHA_MIN_SCORE;
      const actionOk = !data.action || data.action === expectedAction;

      if (!data.success || !scoreOk || !actionOk) {
        console.warn('[reCAPTCHA] rejected:', {
          success: data.success,
          score: data.score,
          action: data.action,
          expectedAction,
          errors: data['error-codes'],
        });
        return next(Errors.recaptchaFailed());
      }
      next();
    } catch (err) {
      console.error('[reCAPTCHA] verify error:', err);
      next(Errors.recaptchaFailed());
    }
  };
}
