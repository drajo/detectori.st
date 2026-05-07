import sharp from 'sharp';

// ── Typy ──────────────────────────────────────────────────────────────────────

export interface FileValidationResult {
  valid: boolean;
  error?: 'FILE_TOO_LARGE' | 'UNSUPPORTED_FORMAT';
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ── Funkcje publiczne ─────────────────────────────────────────────────────────

/**
 * Waliduje plik graficzny pod kątem formatu i rozmiaru.
 * @param buffer       Zawartość pliku
 * @param mimeType     Typ MIME pliku
 * @param maxSizeBytes Maksymalny dozwolony rozmiar w bajtach
 */
export function validateImageFile(
  buffer: Buffer,
  mimeType: string,
  maxSizeBytes: number,
): FileValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: 'UNSUPPORTED_FORMAT' };
  }

  if (buffer.length > maxSizeBytes) {
    return { valid: false, error: 'FILE_TOO_LARGE' };
  }

  return { valid: true };
}

/**
 * Generuje miniaturę obrazu w formacie WebP.
 * @param buffer Zawartość oryginalnego obrazu
 * @param width  Szerokość miniatury w pikselach
 * @param height Wysokość miniatury w pikselach
 * @returns Buffer z miniaturą w formacie WebP
 */
export async function generateThumbnail(
  buffer: Buffer,
  width: number,
  height: number,
): Promise<Buffer> {
  return sharp(buffer)
    .resize(width, height, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
}
