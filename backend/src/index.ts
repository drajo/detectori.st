import path from 'path';
import dotenv from 'dotenv';

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

import './config/env';
import { env } from './config/env';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { errorHandler } from './middleware/errorHandler';
import { prisma } from './lib/prisma';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import findsRouter from './routes/finds';

const app = express();

// ── Security middleware ───────────────────────────────────────────────────────

app.use(helmet({
  // Allow serving frontend from same origin
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
}));

if (env.NODE_ENV === 'production') {
  const canonicalHost = new URL(env.FRONTEND_URL).host;
  app.use((req, res, next) => {
    if (req.headers.host && req.headers.host !== canonicalHost) {
      return res.redirect(301, `${env.FRONTEND_URL}${req.originalUrl}`);
    }
    next();
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin && env.NODE_ENV !== 'production') return callback(null, true);
      if (origin === env.FRONTEND_URL) return callback(null, true);
      // In production, same-origin requests have no Origin header
      if (!origin && env.NODE_ENV === 'production') return callback(null, true);
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Static files (local storage fallback when S3 not configured) ──────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/finds', findsRouter);

// ── Serve frontend in production ──────────────────────────────────────────────
if (env.NODE_ENV === 'production') {
  // backend/dist/index.js → go up to project root → frontend/dist
  const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  console.log(`[STATIC] Serving frontend from: ${frontendDist}`);
  app.use(express.static(frontendDist));
  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
  });
}

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const server = app.listen(env.PORT, () => {
  console.log(`✅ Server running on port ${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = async (signal: string) => {
  console.log(`\n${signal} received — shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
