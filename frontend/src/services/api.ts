// Bazowy URL API
const API_BASE = '/api';

// Przechowywanie access tokena w pamięci (nie w localStorage)
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Callback wywoływany gdy sesja wygaśnie (np. refresh token nieważny)
type SessionExpiredCallback = () => void;
let onSessionExpired: SessionExpiredCallback | null = null;

export function setSessionExpiredCallback(cb: SessionExpiredCallback): void {
  onSessionExpired = cb;
}

// Typ odpowiedzi błędu
interface ApiError {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

// Flaga zapobiegająca wielokrotnemu odświeżaniu tokena
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json() as { accessToken: string };
      setAccessToken(data.accessToken);
      return data.accessToken;
    })
    .catch(() => null)
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  return refreshPromise;
}

// Główna funkcja fetch z obsługą JWT i automatycznym odświeżaniem
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Dodaj Content-Type dla JSON (nie dla FormData)
  if (!(options.body instanceof FormData) && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  // Dodaj Authorization jeśli mamy token
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Obsługa 401 — spróbuj odświeżyć token
  if (response.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
      if (retryResponse.status === 204) return undefined as T;
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json() as ApiError;
        throw new ApiRequestError(
          retryResponse.status,
          errorData.error.code,
          errorData.error.message,
          errorData.error.field,
        );
      }
      return retryResponse.json() as Promise<T>;
    }
    // Odświeżenie nie powiodło się — wyczyść token i powiadom o wygaśnięciu sesji
    setAccessToken(null);
    onSessionExpired?.();
    throw new ApiRequestError(401, 'UNAUTHORIZED', 'Sesja wygasła. Zaloguj się ponownie.');
  }

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    const errorData = await response.json() as ApiError;
    throw new ApiRequestError(
      response.status,
      errorData.error.code,
      errorData.error.message,
      errorData.error.field,
    );
  }

  return response.json() as Promise<T>;
}
