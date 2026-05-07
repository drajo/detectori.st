import { z } from 'zod';

const envSchema = z.object({
  // Wymagane
  DATABASE_URL: z.string().url('DATABASE_URL musi być poprawnym URL-em'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET musi mieć co najmniej 32 znaki'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET musi mieć co najmniej 32 znaki'),
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(65535)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url('FRONTEND_URL musi być poprawnym URL-em'),

  // Opcjonalne — SMTP
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(65535).optional()),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Opcjonalne — S3
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_PUBLIC_BASE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Nieprawidłowa konfiguracja zmiennych środowiskowych:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
