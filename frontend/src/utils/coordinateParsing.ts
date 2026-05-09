export interface Coords {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 20037508.342789244;
const MAX_LAT = 85.05112878;

function clampLat(lat: number): number {
  return Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

export function isGoogleShortLink(url: string): boolean {
  return /^https?:\/\/(www\.)?(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(url.trim());
}

/**
 * Parsuje URL Google Maps. Obsługuje:
 *   - /@LAT,LNG[,zoom...]    — typowy format URL
 *   - !3dLAT!4dLNG           — preferowany jeśli dostępny (bardziej wiarygodne)
 *   - ?q=LAT,LNG             — pin URL
 * Zwraca null dla skróconych linków (maps.app.goo.gl) — CORS uniemożliwia rezolucję.
 */
export function parseGoogleMapsUrl(url: string): Coords | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (isGoogleShortLink(trimmed)) return null;

  // !3dLAT!4dLNG (najbardziej wiarygodne)
  const dPattern = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/;
  const dMatch = dPattern.exec(trimmed);
  if (dMatch) {
    const lat = parseFloat(dMatch[1]);
    const lng = parseFloat(dMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat: round6(lat), lng: round6(lng) };
  }

  // @LAT,LNG[,zoom]
  const atPattern = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:[,/]|$)/;
  const atMatch = atPattern.exec(trimmed);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat: round6(lat), lng: round6(lng) };
  }

  // ?q=LAT,LNG
  const qPattern = /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;
  const qMatch = qPattern.exec(trimmed);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat: round6(lat), lng: round6(lng) };
  }

  return null;
}

/**
 * Parsuje string "LAT, LNG" (typowy format z Google Maps po prawym kliknięciu).
 */
export function parseCoordinateString(s: string): Coords | null {
  if (!s) return null;
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(s);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (!isValidLatLng(lat, lng)) return null;
  return { lat: round6(lat), lng: round6(lng) };
}

/**
 * Parsuje URL maps.arcanum.com z parametrem bbox=minX,minY,maxX,maxY w EPSG:3857.
 * Zwraca centrum bbox jako WGS84.
 */
export function parseArcanumUrl(url: string): Coords | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (!/(^|\.)arcanum\.com$/i.test(parsed.hostname)) return null;

  const bbox = parsed.searchParams.get('bbox');
  if (!bbox) return null;

  const parts = bbox.split(',').map((p) => parseFloat(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;

  const [minX, minY, maxX, maxY] = parts;
  if (Math.abs(minX) > EARTH_RADIUS_M || Math.abs(maxX) > EARTH_RADIUS_M) return null;
  if (Math.abs(minY) > EARTH_RADIUS_M || Math.abs(maxY) > EARTH_RADIUS_M) return null;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const lng = (cx * 180) / EARTH_RADIUS_M;
  const lat = (Math.atan(Math.exp((cy * Math.PI) / EARTH_RADIUS_M)) * 360) / Math.PI - 90;

  if (!isValidLatLng(lat, lng)) return null;
  return { lat: round6(lat), lng: round6(lng) };
}

/**
 * Próbuje sparsować dowolny tekst zawierający koordynaty — Google URL, Arcanum URL lub "lat, lng".
 * Zwraca null jeśli żaden parser nie pasuje.
 */
export function parseAnyCoordinateInput(input: string): Coords | null {
  return (
    parseGoogleMapsUrl(input) ??
    parseArcanumUrl(input) ??
    parseCoordinateString(input)
  );
}

// ── Generatory linków ────────────────────────────────────────────────────────

export function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/?q=${lat},${lng}`;
}

export function buildCoordinateString(lat: number, lng: number): string {
  return `${lat}, ${lng}`;
}

/**
 * Buduje URL Arcanum z bbox o promieniu ~2.5km wokół punktu.
 */
export function buildArcanumUrl(lat: number, lng: number): string {
  const clampedLat = clampLat(lat);
  const x = (lng * EARTH_RADIUS_M) / 180;
  const y = (Math.log(Math.tan(((90 + clampedLat) * Math.PI) / 360)) * EARTH_RADIUS_M) / Math.PI;
  const halfSize = 2500;
  const minX = (x - halfSize).toFixed(2);
  const minY = (y - halfSize).toFixed(2);
  const maxX = (x + halfSize).toFixed(2);
  const maxY = (y + halfSize).toFixed(2);
  return `https://maps.arcanum.com/en/?bbox=${encodeURIComponent(`${minX},${minY},${maxX},${maxY}`)}`;
}
