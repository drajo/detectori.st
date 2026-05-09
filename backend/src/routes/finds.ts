import { Router, Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Errors } from '../utils/errors';
import { validateImageFile, generateThumbnail, getMimeExtension } from '../utils/imageProcessor';
import { uploadFile, deleteFile, extractS3Key } from '../utils/storage';

const router = Router();

// ── Schematy walidacji ────────────────────────────────────────────────────────

const createFindSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(200),
  description: z.string().max(2000).optional(),
  discoveryDate: z.string().datetime().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

const updateFindSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  discoveryDate: z.string().datetime().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

// ── POST /api/finds ───────────────────────────────────────────────────────────

router.post(
  '/',
  requireAuth,
  validate(createFindSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, discoveryDate, latitude, longitude } = req.body as z.infer<
        typeof createFindSchema
      >;

      // Walidacja: latitude i longitude muszą być podane razem
      const hasLat = latitude !== undefined && latitude !== null;
      const hasLon = longitude !== undefined && longitude !== null;
      if (hasLat !== hasLon) {
        return next(Errors.findCoordinatesInvalid());
      }

      const find = await prisma.find.create({
        data: {
          userId: req.user!.id,
          name,
          description,
          discoveryDate: discoveryDate ? new Date(discoveryDate) : null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
        },
      });

      res.status(201).json({
        ...find,
        photos: [],
        attributes: [],
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/finds ───────────────────────────────────────────────────────────

router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parsuj i waliduj query params
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const search = (req.query.search as string) || undefined;
      const sortBy = (['createdAt', 'discoveryDate', 'name'].includes(req.query.sortBy as string)
        ? req.query.sortBy
        : 'createdAt') as 'createdAt' | 'discoveryDate' | 'name';
      const sortOrder = (req.query.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

      // Warunek where
      const where = {
        userId: req.user!.id,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };

      // Pobierz total i dane równolegle
      const [total, finds] = await Promise.all([
        prisma.find.count({ where }),
        prisma.find.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            photos: {
              where: { isCover: true },
              take: 1,
            },
          },
        }),
      ]);

      // Mapuj na FindListItem
      const data = finds.map((find: (typeof finds)[number]) => ({
        id: find.id,
        name: find.name,
        description: find.description,
        discoveryDate: find.discoveryDate,
        latitude: find.latitude,
        longitude: find.longitude,
        createdAt: find.createdAt,
        updatedAt: find.updatedAt,
        coverPhoto: find.photos[0] ?? null,
      }));

      res.status(200).json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/finds/map ───────────────────────────────────────────────────────

router.get(
  '/map',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const finds = await prisma.find.findMany({
        where: {
          userId: req.user!.id,
          latitude: { not: null },
          longitude: { not: null },
        },
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          photos: {
            where: { isCover: true },
            take: 1,
            select: { thumbnailUrl: true },
          },
        },
      });

      const markers = finds.map((find: (typeof finds)[number]) => ({
        id: find.id,
        name: find.name,
        latitude: find.latitude as number,
        longitude: find.longitude as number,
        coverThumbnailUrl: find.photos[0]?.thumbnailUrl ?? null,
      }));

      res.status(200).json(markers);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/finds/:id ────────────────────────────────────────────────────────

router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const find = await prisma.find.findUnique({
        where: { id },
        include: {
          photos: { orderBy: { createdAt: 'asc' } },
          attributes: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!find) {
        return next(Errors.findNotFound());
      }

      if (find.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      res.status(200).json(find);
    } catch (err) {
      next(err);
    }
  },
);

// ── PATCH /api/finds/:id ──────────────────────────────────────────────────────

router.patch(
  '/:id',
  requireAuth,
  validate(updateFindSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const body = req.body as z.infer<typeof updateFindSchema>;

      // Sprawdź istnienie znaleziska
      const existing = await prisma.find.findUnique({ where: { id } });
      if (!existing) {
        return next(Errors.findNotFound());
      }

      // Sprawdź własność
      if (existing.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      // Walidacja spójności współrzędnych (jeśli którakolwiek jest podana)
      const latProvided = body.latitude !== undefined;
      const lonProvided = body.longitude !== undefined;

      if (latProvided || lonProvided) {
        // Oblicz efektywne wartości po aktualizacji
        const effectiveLat = latProvided ? body.latitude : existing.latitude;
        const effectiveLon = lonProvided ? body.longitude : existing.longitude;
        const effectiveHasLat = effectiveLat !== undefined && effectiveLat !== null;
        const effectiveHasLon = effectiveLon !== undefined && effectiveLon !== null;
        if (effectiveHasLat !== effectiveHasLon) {
          return next(Errors.findCoordinatesInvalid());
        }
      }

      // Przygotuj dane do aktualizacji
      const updateData: Record<string, unknown> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.discoveryDate !== undefined) {
        updateData.discoveryDate = body.discoveryDate ? new Date(body.discoveryDate) : null;
      }
      if (body.latitude !== undefined) updateData.latitude = body.latitude;
      if (body.longitude !== undefined) updateData.longitude = body.longitude;

      const updated = await prisma.find.update({
        where: { id },
        data: updateData,
        include: {
          photos: { orderBy: { createdAt: 'asc' } },
          attributes: { orderBy: { createdAt: 'asc' } },
        },
      });

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

// ── DELETE /api/finds/:id ─────────────────────────────────────────────────────

router.delete(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Pobierz znalezisko wraz ze zdjęciami
      const find = await prisma.find.findUnique({
        where: { id },
        include: { photos: true },
      });

      if (!find) {
        return next(Errors.findNotFound());
      }

      // Sprawdź własność
      if (find.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      // Usuń pliki zdjęć z S3 (gracefully — błędy tylko logujemy)
      for (const photo of find.photos) {
        try {
          const key = extractS3Key(photo.url);
          await deleteFile(key);
        } catch (err) {
          console.error(`Nie udało się usunąć pliku z S3 (url: ${photo.url}):`, err);
        }

        // Usuń też miniaturę jeśli różni się od oryginału
        if (photo.thumbnailUrl && photo.thumbnailUrl !== photo.url) {
          try {
            const thumbKey = extractS3Key(photo.thumbnailUrl);
            await deleteFile(thumbKey);
          } catch (err) {
            console.error(
              `Nie udało się usunąć miniatury z S3 (url: ${photo.thumbnailUrl}):`,
              err,
            );
          }
        }
      }

      // Usuń znalezisko z bazy (kaskadowo usunie photos i attributes)
      await prisma.find.delete({ where: { id } });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /api/finds/:id/photos ────────────────────────────────────────────────

const PHOTO_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PHOTO_MAX_SIZE },
});

router.post(
  '/:id/photos',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    // 1. Sprawdź istnienie znaleziska i własność
    const find = await prisma.find.findUnique({ where: { id } });
    if (!find) {
      return next(Errors.findNotFound());
    }
    if (find.userId !== req.user!.id) {
      return next(Errors.forbidden());
    }

    // 2. Sprawdź limit 10 zdjęć
    const photoCount = await prisma.photo.count({ where: { findId: id } });
    if (photoCount >= 10) {
      return next(Errors.findPhotoLimitExceeded());
    }

    // 3. Obsłuż multer upload
    photoUpload.single('photo')(req, res, async (err) => {
      try {
        if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return next(Errors.fileTooLarge(10));
        }
        if (err) {
          return next(err);
        }

        const file = req.file;

        // 4. Jeśli brak pliku
        if (!file) {
          return next(Errors.unsupportedFormat());
        }

        // 5. Waliduj plik
        const validation = validateImageFile(file.buffer, file.mimetype, PHOTO_MAX_SIZE);
        if (!validation.valid) {
          if (validation.error === 'FILE_TOO_LARGE') {
            return next(Errors.fileTooLarge(10));
          }
          return next(Errors.unsupportedFormat());
        }

        // 6. Wygeneruj miniaturę
        const thumbnailBuffer = await generateThumbnail(file.buffer, 400, 400);

        // 7. Wygeneruj klucze S3
        const ext = getMimeExtension(file.mimetype);
        const now = Date.now();
        const originalKey = `finds/${id}/photos/${now}_original.${ext}`;
        const thumbKey = `finds/${id}/photos/${now}_thumb.webp`;

        // 8. Uploaduj oryginał i miniaturę równolegle
        const [url, thumbnailUrl] = await Promise.all([
          uploadFile(originalKey, file.buffer, file.mimetype),
          uploadFile(thumbKey, thumbnailBuffer, 'image/webp'),
        ]);

        // 9. Sprawdź czy to pierwsze zdjęcie
        const isCover = photoCount === 0;

        // 10. Zapisz w bazie
        const photo = await prisma.photo.create({
          data: {
            findId: id,
            url,
            thumbnailUrl,
            isCover,
            sizeBytes: file.size,
            mimeType: file.mimetype,
          },
        });

        // 11. Odpowiedź 201
        res.status(201).json(photo);
      } catch (innerErr) {
        next(innerErr);
      }
    });
  },
);

// ── DELETE /api/finds/:id/photos/:photoId ─────────────────────────────────────

router.delete(
  '/:id/photos/:photoId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, photoId } = req.params;

      // 1. Pobierz znalezisko, sprawdź istnienie i własność
      const find = await prisma.find.findUnique({ where: { id } });
      if (!find) {
        return next(Errors.findNotFound());
      }
      if (find.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      // 2. Pobierz zdjęcie
      const photo = await prisma.photo.findUnique({ where: { id: photoId } });

      // 3. Sprawdź istnienie i przynależność do znaleziska
      if (!photo || photo.findId !== id) {
        return next(Errors.photoNotFound());
      }

      // 4. Usuń pliki z S3 (gracefully)
      try {
        await deleteFile(extractS3Key(photo.url));
      } catch (err) {
        console.error(`Nie udało się usunąć pliku z S3 (url: ${photo.url}):`, err);
      }

      if (photo.thumbnailUrl && photo.thumbnailUrl !== photo.url) {
        try {
          await deleteFile(extractS3Key(photo.thumbnailUrl));
        } catch (err) {
          console.error(`Nie udało się usunąć miniatury z S3 (url: ${photo.thumbnailUrl}):`, err);
        }
      }

      // 5. Usuń rekord z bazy
      await prisma.photo.delete({ where: { id: photoId } });

      // 6. Jeśli usunięte zdjęcie było okładką — ustaw nową okładkę
      if (photo.isCover === true) {
        const nextPhoto = await prisma.photo.findFirst({
          where: { findId: id },
          orderBy: { createdAt: 'asc' },
        });

        if (nextPhoto) {
          await prisma.photo.update({
            where: { id: nextPhoto.id },
            data: { isCover: true },
          });
        }
      }

      // 7. Odpowiedź 204
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ── PATCH /api/finds/:id/photos/:photoId/cover ────────────────────────────────

router.patch(
  '/:id/photos/:photoId/cover',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, photoId } = req.params;

      // 1. Pobierz znalezisko, sprawdź istnienie i własność
      const find = await prisma.find.findUnique({ where: { id } });
      if (!find) {
        return next(Errors.findNotFound());
      }
      if (find.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      // 2. Pobierz zdjęcie, sprawdź istnienie i przynależność
      const photo = await prisma.photo.findUnique({ where: { id: photoId } });
      if (!photo || photo.findId !== id) {
        return next(Errors.photoNotFound());
      }

      // 3. W transakcji: reset poprzedniej okładki i ustaw nową
      const [, updatedPhoto] = await prisma.$transaction([
        prisma.photo.updateMany({
          where: { findId: id, isCover: true },
          data: { isCover: false },
        }),
        prisma.photo.update({
          where: { id: photoId },
          data: { isCover: true },
        }),
      ]);

      // 4. Odpowiedź 200 z zaktualizowanym zdjęciem
      res.status(200).json(updatedPhoto);
    } catch (err) {
      next(err);
    }
  },
);

// ── Schematy walidacji atrybutów ─────────────────────────────────────────────

const createAttributeSchema = z.object({
  key: z.string().min(1, 'Klucz jest wymagany').max(100),
  value: z.string().max(500),
});

const updateAttributeSchema = z.object({
  value: z.string().max(500),
});

// ── POST /api/finds/:id/attributes ────────────────────────────────────────────

router.post(
  '/:id/attributes',
  requireAuth,
  validate(createAttributeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { key, value } = req.body as z.infer<typeof createAttributeSchema>;

      // Sprawdź istnienie znaleziska
      const find = await prisma.find.findUnique({ where: { id } });
      if (!find) {
        return next(Errors.findNotFound());
      }

      // Sprawdź własność
      if (find.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      const attribute = await prisma.attribute.create({
        data: { findId: id, key, value },
      });

      res.status(201).json(attribute);
    } catch (err) {
      next(err);
    }
  },
);

// ── PATCH /api/finds/:id/attributes/:attrId ───────────────────────────────────

router.patch(
  '/:id/attributes/:attrId',
  requireAuth,
  validate(updateAttributeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, attrId } = req.params;
      const { value } = req.body as z.infer<typeof updateAttributeSchema>;

      // Sprawdź istnienie znaleziska
      const find = await prisma.find.findUnique({ where: { id } });
      if (!find) {
        return next(Errors.findNotFound());
      }

      // Sprawdź własność
      if (find.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      // Pobierz atrybut
      const attribute = await prisma.attribute.findUnique({ where: { id: attrId } });

      // Sprawdź istnienie i przynależność do znaleziska
      if (!attribute || attribute.findId !== id) {
        return next(Errors.attributeNotFound());
      }

      const updated = await prisma.attribute.update({
        where: { id: attrId },
        data: { value },
      });

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

// ── DELETE /api/finds/:id/attributes/:attrId ──────────────────────────────────

router.delete(
  '/:id/attributes/:attrId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, attrId } = req.params;

      // Sprawdź istnienie znaleziska
      const find = await prisma.find.findUnique({ where: { id } });
      if (!find) {
        return next(Errors.findNotFound());
      }

      // Sprawdź własność
      if (find.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      // Pobierz atrybut
      const attribute = await prisma.attribute.findUnique({ where: { id: attrId } });

      // Sprawdź istnienie i przynależność do znaleziska
      if (!attribute || attribute.findId !== id) {
        return next(Errors.attributeNotFound());
      }

      await prisma.attribute.delete({ where: { id: attrId } });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
