import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

// ── Konfiguracja S3 ───────────────────────────────────────────────────────────

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.S3_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? '',
      },
      ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
    });
  }
  return s3Client;
}

function isS3Configured(): boolean {
  return Boolean(env.S3_BUCKET);
}

// ── Tryb lokalny ──────────────────────────────────────────────────────────────

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function localUrl(key: string): string {
  // Zwraca URL względny — serwer powinien serwować /uploads statycznie
  return `/uploads/${key}`;
}

// ── Publiczne API ─────────────────────────────────────────────────────────────

/**
 * Uploaduje plik do S3 (lub zapisuje lokalnie jeśli S3 nie jest skonfigurowany).
 * @param key   Klucz obiektu w S3 (np. "avatars/userId/timestamp.webp")
 * @param buffer Zawartość pliku
 * @param mimeType Typ MIME pliku
 * @returns Publiczny URL pliku
 */
export async function uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
  if (isS3Configured()) {
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await getS3Client().send(command);

    // Zbuduj publiczny URL
    if (env.S3_ENDPOINT) {
      // MinIO / custom endpoint
      return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
    }
    // AWS S3
    const region = env.S3_REGION ?? 'us-east-1';
    return `https://${env.S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
  }

  // Tryb lokalny
  ensureUploadsDir();
  const localPath = path.join(UPLOADS_DIR, key.replace(/\//g, '_'));
  fs.writeFileSync(localPath, buffer);
  return localUrl(key.replace(/\//g, '_'));
}

/**
 * Usuwa plik z S3 (lub lokalnie jeśli S3 nie jest skonfigurowany).
 * @param key Klucz obiektu w S3
 */
export async function deleteFile(key: string): Promise<void> {
  if (isS3Configured()) {
    const command = new DeleteObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: key,
    });

    await getS3Client().send(command);
    return;
  }

  // Tryb lokalny
  const localPath = path.join(UPLOADS_DIR, key.replace(/\//g, '_'));
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
  }
}
