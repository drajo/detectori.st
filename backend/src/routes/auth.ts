import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { validate } from '../middleware/validate';
import { Errors } from '../utils/errors';
import { generateVerificationToken, generateAccessToken, generateRefreshToken } from '../utils/token';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { verifyRecaptcha } from '../middleware/recaptcha';

const router = Router();

// ── Schematy walidacji ────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    email: z.string().email('Podaj prawidłowy adres e-mail'),
    username: z
      .string()
      .min(3, 'Nazwa użytkownika musi mieć co najmniej 3 znaki')
      .max(30, 'Nazwa użytkownika może mieć maksymalnie 30 znaków'),
    password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
  });

// ── POST /api/auth/register ───────────────────────────────────────────────────

router.post(
  '/register',
  verifyRecaptcha('register'),
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, username, password } = req.body as z.infer<typeof registerSchema>;

      // Sprawdź unikalność e-mail
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return next(Errors.emailAlreadyExists());
      }

      // Sprawdź unikalność username
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        return next(Errors.usernameAlreadyExists());
      }

      // Hashuj hasło
      const passwordHash = await bcrypt.hash(password, 12);

      // Utwórz użytkownika i token weryfikacyjny w jednej transakcji
      const verificationToken = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: {
            email,
            username,
            passwordHash,
            isVerified: false,
          },
        });

        await tx.verificationToken.create({
          data: {
            userId: user.id,
            token: verificationToken,
            expiresAt,
          },
        });
      });

      // Wyślij e-mail weryfikacyjny (błąd wysyłki nie blokuje rejestracji)
      try {
        await sendVerificationEmail(email, verificationToken, env.FRONTEND_URL);
      } catch (emailErr) {
        console.error('Błąd wysyłki e-maila weryfikacyjnego:', emailErr);
      }
      res.status(201).json({
        message: 'Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail.',
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/auth/verify?token=... ────────────────────────────────────────────

router.get(
  '/verify',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return next(Errors.tokenInvalid());
      }

      // Znajdź token weryfikacyjny
      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
      });

      // Token nie istnieje lub wygasł
      if (!verificationToken || verificationToken.expiresAt < new Date()) {
        return next(Errors.tokenInvalid());
      }

      // Token już użyty
      if (verificationToken.usedAt !== null) {
        return next(Errors.tokenAlreadyUsed());
      }

      // Zaktualizuj token i użytkownika w jednej transakcji
      await prisma.$transaction([
        prisma.verificationToken.update({
          where: { id: verificationToken.id },
          data: { usedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: verificationToken.userId },
          data: { isVerified: true },
        }),
      ]);

      // Zwróć sukces — frontend sam przekieruje do logowania
      res.status(200).json({ message: 'Konto zostało zweryfikowane.' });
    } catch (err) {
      next(err);
    }
  },
);

// ── Schematy walidacji — login ────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Podaj prawidłowy adres e-mail'),
  password: z.string(),
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

router.post(
  '/login',
  verifyRecaptcha('login'),
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as z.infer<typeof loginSchema>;

      // Znajdź użytkownika po email
      const user = await prisma.user.findUnique({ where: { email } });

      // Zawsze ten sam błąd — nie ujawniaj który element jest nieprawidłowy
      if (!user) {
        return next(Errors.invalidCredentials());
      }

      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return next(Errors.invalidCredentials());
      }

      // Sprawdź weryfikację konta
      if (!user.isVerified) {
        return next(Errors.accountNotVerified());
      }

      // Generuj tokeny
      const accessToken = generateAccessToken({ id: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ id: user.id });

      // Oblicz czas wygaśnięcia sesji (7 dni)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Zapisz sesję w bazie
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt,
          lastActiveAt: new Date(),
        },
      });

      // Ustaw refresh token jako httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

router.post(
  '/logout',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;

      // Brak tokenu — już wylogowany
      if (!refreshToken) {
        res.status(204).send();
        return;
      }

      // Usuń sesję z bazy
      await prisma.session.deleteMany({ where: { refreshToken } });

      // Wyczyść cookie
      res.clearCookie('refreshToken');

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /api/auth/refresh ────────────────────────────────────────────────────

router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;

      if (!refreshToken) {
        return next(Errors.tokenInvalid());
      }

      // Znajdź sesję w bazie
      const session = await prisma.session.findUnique({ where: { refreshToken } });

      if (!session) {
        return next(Errors.tokenInvalid());
      }

      // Sprawdź czy sesja nie wygasła (hard expiry)
      if (session.expiresAt < new Date()) {
        return next(Errors.tokenExpired());
      }

      // Sprawdź sliding expiration — 60 minut braku aktywności
      const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (session.lastActiveAt < sixtyMinutesAgo) {
        return next(Errors.tokenExpired());
      }

      // Zweryfikuj JWT refresh token
      let payload: { id: string };
      try {
        payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: string };
      } catch {
        return next(Errors.tokenInvalid());
      }

      // Rotacja tokenów — generuj nowe
      const newRefreshToken = generateRefreshToken({ id: payload.id });
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Pobierz email użytkownika do access tokena
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { email: true },
      });

      if (!user) {
        return next(Errors.tokenInvalid());
      }

      // Wygeneruj access token z poprawnym emailem
      const accessToken = generateAccessToken({ id: payload.id, email: user.email });

      // Zaktualizuj sesję
      await prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: newRefreshToken,
          expiresAt: newExpiresAt,
          lastActiveAt: new Date(),
        },
      });

      // Ustaw nowe cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ accessToken });
    } catch (err) {
      next(err);
    }
  },
);

// ── Schematy walidacji — reset hasła ─────────────────────────────────────────

const forgotPasswordSchema = z.object({
  email: z.string().email('Podaj prawidłowy adres e-mail'),
});

const resetPasswordSchema = z
  .object({
    token: z.string(),
    newPassword: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmNewPassword'],
  });

// ── POST /api/auth/forgot-password ───────────────────────────────────────────

router.post(
  '/forgot-password',
  verifyRecaptcha('forgot_password'),
  validate(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as z.infer<typeof forgotPasswordSchema>;

      const RESPONSE_MESSAGE =
        'Jeśli konto z podanym adresem e-mail istnieje, wysłaliśmy link do resetowania hasła.';

      // Znajdź użytkownika — nie ujawniaj czy istnieje
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        res.status(200).json({ message: RESPONSE_MESSAGE });
        return;
      }

      // Unieważnij poprzednie aktywne tokeny resetu
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      // Wygeneruj nowy token resetu
      const resetToken = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // +1h

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
        },
      });

      // Wyślij e-mail (błąd wysyłki nie blokuje odpowiedzi)
      try {
        await sendPasswordResetEmail(email, resetToken, env.FRONTEND_URL);
      } catch (emailErr) {
        console.error('Błąd wysyłki e-maila resetu hasła:', emailErr);
      }

      res.status(200).json({ message: RESPONSE_MESSAGE });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /api/auth/reset-password ────────────────────────────────────────────

router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body as z.infer<typeof resetPasswordSchema>;

      // Znajdź token resetu
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
      });

      // Token nie istnieje lub wygasł
      if (!resetToken || resetToken.expiresAt < new Date()) {
        return next(Errors.tokenInvalid());
      }

      // Token już użyty
      if (resetToken.usedAt !== null) {
        return next(Errors.tokenAlreadyUsed());
      }

      // Hashuj nowe hasło
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Zaktualizuj token, hasło i usuń wszystkie sesje w transakcji
      await prisma.$transaction([
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash: newPasswordHash },
        }),
        prisma.session.deleteMany({
          where: { userId: resetToken.userId },
        }),
      ]);

      res.status(200).json({
        message: 'Hasło zostało zmienione. Możesz się teraz zalogować.',
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /api/auth/resend-verification ───────────────────────────────────────

const resendVerificationSchema = z.object({
  email: z.string().email('Podaj prawidłowy adres e-mail'),
});

router.post(
  '/resend-verification',
  validate(resendVerificationSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as z.infer<typeof resendVerificationSchema>;

      const RESPONSE_MESSAGE =
        'Jeśli konto wymaga weryfikacji, wysłaliśmy nowy link aktywacyjny.';

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || user.isVerified) {
        res.status(200).json({ message: RESPONSE_MESSAGE });
        return;
      }

      await prisma.verificationToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const verificationToken = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.verificationToken.create({
        data: { userId: user.id, token: verificationToken, expiresAt },
      });

      try {
        await sendVerificationEmail(email, verificationToken, env.FRONTEND_URL);
      } catch (emailErr) {
        console.error('Błąd wysyłki e-maila weryfikacyjnego:', emailErr);
      }

      res.status(200).json({ message: RESPONSE_MESSAGE });
    } catch (err) {
      next(err);
    }
  },
);

export default router;


