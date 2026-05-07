import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import multer, { MulterError } from 'multer';

import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Errors } from '../utils/errors';
import { uploadFile } from '../utils/storage';
import { validateImageFile, generateThumbnail } from '../utils/imageProcessor';

// ── Konfiguracja multer ───────────────────────────────────────────────────────

const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_SIZE },
});

const router = Router();

// ── Schematy walidacji ────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmNewPassword'],
  });

// ── Pomocnicza funkcja mapowania profilu ──────────────────────────────────────

function mapUserProfile(user: {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

// ── GET /api/users/me ─────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return next(Errors.notFound('Użytkownik'));
    }

    res.status(200).json(mapUserProfile(user));
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/users/me ───────────────────────────────────────────────────────

router.patch(
  '/me',
  requireAuth,
  validate(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof updateProfileSchema>;

      // Sprawdź unikalność username (jeśli podany)
      if (body.username) {
        const existing = await prisma.user.findUnique({
          where: { username: body.username },
        });

        if (existing && existing.id !== req.user!.id) {
          return next(Errors.usernameAlreadyExists());
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: { ...body },
      });

      res.status(200).json(mapUserProfile(updatedUser));
    } catch (err) {
      next(err);
    }
  },
);

// ── PUT /api/users/me/password ────────────────────────────────────────────────

router.put(
  '/me/password',
  requireAuth,
  validate(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;

      // Pobierz użytkownika z hashem hasła
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { id: true, passwordHash: true },
      });

      if (!user) {
        return next(Errors.notFound('Użytkownik'));
      }

      // Zweryfikuj aktualne hasło
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return next(Errors.invalidCurrentPassword());
      }

      // Hashuj nowe hasło
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Transakcja: zaktualizuj hasło i usuń inne sesje
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newPasswordHash },
        }),
        prisma.session.deleteMany({
          where: {
            userId: user.id,
            refreshToken: { not: req.cookies?.refreshToken ?? '' },
          },
        }),
      ]);

      res.status(200).json({ message: 'Hasło zostało zmienione.' });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /api/users/me/avatar ─────────────────────────────────────────────────

router.post(
  '/me/avatar',
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('avatar')(req, res, (err) => {
      if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return next(Errors.fileTooLarge(5));
      }
      if (err) {
        return next(err);
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;

      if (!file) {
        return next(Errors.unsupportedFormat());
      }

      // Walidacja formatu i rozmiaru
      const validation = validateImageFile(file.buffer, file.mimetype, AVATAR_MAX_SIZE);
      if (!validation.valid) {
        if (validation.error === 'FILE_TOO_LARGE') {
          return next(Errors.fileTooLarge(5));
        }
        return next(Errors.unsupportedFormat());
      }

      // Generuj miniaturę 200×200 w formacie WebP
      const thumbnail = await generateThumbnail(file.buffer, 200, 200);

      // Klucz S3
      const userId = req.user!.id;
      const key = `avatars/${userId}/${Date.now()}.webp`;

      // Upload do S3 / lokalnie
      const avatarUrl = await uploadFile(key, thumbnail, 'image/webp');

      // Zaktualizuj rekord użytkownika
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });

      res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
