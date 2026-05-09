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

const tagsSchema = z.array(z.string().min(1).max(50)).max(20);

const createPlaceSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(200),
  description: z.string().max(2000).optional(),
  tags: tagsSchema.optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

const updatePlaceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  tags: tagsSchema.optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

function normalizeTags(tags: string[] | undefined): string[] | undefined {
  if (!tags) return undefined;
  const trimmed = tags.map((t) => t.trim()).filter((t) => t.length > 0);
  // Deduplikacja zachowująca kolejność, case-insensitive porównanie ale zachowujemy oryginalną pisownię
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of trimmed) {
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tag);
    }
  }
  return result;
}

// ── POST /api/places ──────────────────────────────────────────────────────────

router.post(
  '/',
  requireAuth,
  validate(createPlaceSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, tags, latitude, longitude } = req.body as z.infer<
        typeof createPlaceSchema
      >;

      const hasLat = latitude !== undefined && latitude !== null;
      const hasLon = longitude !== undefined && longitude !== null;
      if (hasLat !== hasLon) {
        return next(Errors.placeCoordinatesInvalid());
      }

      const place = await prisma.place.create({
        data: {
          userId: req.user!.id,
          name,
          description,
          tags: normalizeTags(tags) ?? [],
          latitude: latitude ?? null,
          longitude: longitude ?? null,
        },
      });

      res.status(201).json({
        ...place,
        photos: [],
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/places ───────────────────────────────────────────────────────────

router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const search = (req.query.search as string) || undefined;
      const tag = (req.query.tag as string) || undefined;
      const sortBy = (['createdAt', 'name'].includes(req.query.sortBy as string)
        ? req.query.sortBy
        : 'createdAt') as 'createdAt' | 'name';
      const sortOrder = (req.query.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

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
        ...(tag ? { tags: { has: tag } } : {}),
      };

      const [total, places] = await Promise.all([
        prisma.place.count({ where }),
        prisma.place.findMany({
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

      const data = places.map((place: (typeof places)[number]) => ({
        id: place.id,
        name: place.name,
        description: place.description,
        tags: place.tags,
        latitude: place.latitude,
        longitude: place.longitude,
        createdAt: place.createdAt,
        updatedAt: place.updatedAt,
        coverPhoto: place.photos[0] ?? null,
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

// ── GET /api/places/map ──────────────────────────────────────────────────────

router.get(
  '/map',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const places = await prisma.place.findMany({
        where: {
          userId: req.user!.id,
          latitude: { not: null },
          longitude: { not: null },
        },
        select: {
          id: true,
          name: true,
          tags: true,
          latitude: true,
          longitude: true,
          photos: {
            where: { isCover: true },
            take: 1,
            select: { thumbnailUrl: true },
          },
        },
      });

      const markers = places.map((place: (typeof places)[number]) => ({
        id: place.id,
        name: place.name,
        tags: place.tags,
        latitude: place.latitude as number,
        longitude: place.longitude as number,
        coverThumbnailUrl: place.photos[0]?.thumbnailUrl ?? null,
      }));

      res.status(200).json(markers);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/places/tags ─────────────────────────────────────────────────────

router.get(
  '/tags',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rows = await prisma.$queryRaw<Array<{ tag: string }>>`
        SELECT DISTINCT unnest(tags) AS tag
        FROM "Place"
        WHERE "userId" = ${req.user!.id}
        ORDER BY tag ASC
      `;
      res.status(200).json(rows.map((r) => r.tag));
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/places/:id ──────────────────────────────────────────────────────

router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const place = await prisma.place.findUnique({
        where: { id },
        include: {
          photos: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!place) {
        return next(Errors.placeNotFound());
      }

      if (place.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      res.status(200).json(place);
    } catch (err) {
      next(err);
    }
  },
);

// ── PATCH /api/places/:id ────────────────────────────────────────────────────

router.patch(
  '/:id',
  requireAuth,
  validate(updatePlaceSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const body = req.body as z.infer<typeof updatePlaceSchema>;

      const existing = await prisma.place.findUnique({ where: { id } });
      if (!existing) {
        return next(Errors.placeNotFound());
      }

      if (existing.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      const latProvided = body.latitude !== undefined;
      const lonProvided = body.longitude !== undefined;

      if (latProvided || lonProvided) {
        const effectiveLat = latProvided ? body.latitude : existing.latitude;
        const effectiveLon = lonProvided ? body.longitude : existing.longitude;
        const effectiveHasLat = effectiveLat !== undefined && effectiveLat !== null;
        const effectiveHasLon = effectiveLon !== undefined && effectiveLon !== null;
        if (effectiveHasLat !== effectiveHasLon) {
          return next(Errors.placeCoordinatesInvalid());
        }
      }

      const updateData: Record<string, unknown> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.tags !== undefined) updateData.tags = normalizeTags(body.tags) ?? [];
      if (body.latitude !== undefined) updateData.latitude = body.latitude;
      if (body.longitude !== undefined) updateData.longitude = body.longitude;

      const updated = await prisma.place.update({
        where: { id },
        data: updateData,
        include: {
          photos: { orderBy: { createdAt: 'asc' } },
        },
      });

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

// ── DELETE /api/places/:id ───────────────────────────────────────────────────

router.delete(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const place = await prisma.place.findUnique({
        where: { id },
        include: { photos: true },
      });

      if (!place) {
        return next(Errors.placeNotFound());
      }

      if (place.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      for (const photo of place.photos) {
        try {
          await deleteFile(extractS3Key(photo.url));
        } catch (err) {
          console.error(`Nie udało się usunąć pliku z S3 (url: ${photo.url}):`, err);
        }

        if (photo.thumbnailUrl && photo.thumbnailUrl !== photo.url) {
          try {
            await deleteFile(extractS3Key(photo.thumbnailUrl));
          } catch (err) {
            console.error(
              `Nie udało się usunąć miniatury z S3 (url: ${photo.thumbnailUrl}):`,
              err,
            );
          }
        }
      }

      await prisma.place.delete({ where: { id } });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /api/places/:id/photos ──────────────────────────────────────────────

const PHOTO_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const PHOTO_LIMIT_PER_PLACE = 20;

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PHOTO_MAX_SIZE },
});

router.post(
  '/:id/photos',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const place = await prisma.place.findUnique({ where: { id } });
    if (!place) {
      return next(Errors.placeNotFound());
    }
    if (place.userId !== req.user!.id) {
      return next(Errors.forbidden());
    }

    const photoCount = await prisma.placePhoto.count({ where: { placeId: id } });
    if (photoCount >= PHOTO_LIMIT_PER_PLACE) {
      return next(Errors.placePhotoLimitExceeded());
    }

    photoUpload.single('photo')(req, res, async (err) => {
      try {
        if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return next(Errors.fileTooLarge(10));
        }
        if (err) {
          return next(err);
        }

        const file = req.file;
        if (!file) {
          return next(Errors.unsupportedFormat());
        }

        const validation = validateImageFile(file.buffer, file.mimetype, PHOTO_MAX_SIZE);
        if (!validation.valid) {
          if (validation.error === 'FILE_TOO_LARGE') {
            return next(Errors.fileTooLarge(10));
          }
          return next(Errors.unsupportedFormat());
        }

        const thumbnailBuffer = await generateThumbnail(file.buffer, 400, 400);

        const ext = getMimeExtension(file.mimetype);
        const now = Date.now();
        const originalKey = `places/${id}/photos/${now}_original.${ext}`;
        const thumbKey = `places/${id}/photos/${now}_thumb.webp`;

        const [url, thumbnailUrl] = await Promise.all([
          uploadFile(originalKey, file.buffer, file.mimetype),
          uploadFile(thumbKey, thumbnailBuffer, 'image/webp'),
        ]);

        const isCover = photoCount === 0;

        const photo = await prisma.placePhoto.create({
          data: {
            placeId: id,
            url,
            thumbnailUrl,
            isCover,
            sizeBytes: file.size,
            mimeType: file.mimetype,
          },
        });

        res.status(201).json(photo);
      } catch (innerErr) {
        next(innerErr);
      }
    });
  },
);

// ── DELETE /api/places/:id/photos/:photoId ──────────────────────────────────

router.delete(
  '/:id/photos/:photoId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, photoId } = req.params;

      const place = await prisma.place.findUnique({ where: { id } });
      if (!place) {
        return next(Errors.placeNotFound());
      }
      if (place.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      const photo = await prisma.placePhoto.findUnique({ where: { id: photoId } });

      if (!photo || photo.placeId !== id) {
        return next(Errors.placePhotoNotFound());
      }

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

      await prisma.placePhoto.delete({ where: { id: photoId } });

      if (photo.isCover === true) {
        const nextPhoto = await prisma.placePhoto.findFirst({
          where: { placeId: id },
          orderBy: { createdAt: 'asc' },
        });

        if (nextPhoto) {
          await prisma.placePhoto.update({
            where: { id: nextPhoto.id },
            data: { isCover: true },
          });
        }
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ── PATCH /api/places/:id/photos/:photoId/cover ─────────────────────────────

router.patch(
  '/:id/photos/:photoId/cover',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, photoId } = req.params;

      const place = await prisma.place.findUnique({ where: { id } });
      if (!place) {
        return next(Errors.placeNotFound());
      }
      if (place.userId !== req.user!.id) {
        return next(Errors.forbidden());
      }

      const photo = await prisma.placePhoto.findUnique({ where: { id: photoId } });
      if (!photo || photo.placeId !== id) {
        return next(Errors.placePhotoNotFound());
      }

      const [, updatedPhoto] = await prisma.$transaction([
        prisma.placePhoto.updateMany({
          where: { placeId: id, isCover: true },
          data: { isCover: false },
        }),
        prisma.placePhoto.update({
          where: { id: photoId },
          data: { isCover: true },
        }),
      ]);

      res.status(200).json(updatedPhoto);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
