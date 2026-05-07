/**
 * Testy integracyjne E2E — główny przepływ użytkownika
 *
 * Wymagania: działająca baza PostgreSQL (DATABASE_URL w .env)
 * Uruchomienie: vitest run src/tests/e2e.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';

// ── Dane testowe ──────────────────────────────────────────────────────────────

const timestamp = Date.now();

const testUser = {
  email: `test-${timestamp}@example.com`,
  username: `testuser${timestamp}`,
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!',
};

// ── Stan współdzielony między testami ─────────────────────────────────────────

let accessToken: string;
let findId: string;
let attributeId: string;

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  // Wyczyść dane testowe (kaskadowo usuwa finds, sessions, tokens)
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

// ── Testy ─────────────────────────────────────────────────────────────────────

describe('E2E: Główny przepływ użytkownika', () => {
  // ── 1. Rejestracja ──────────────────────────────────────────────────────────

  it('1. Rejestracja — POST /api/auth/register → 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  // ── 2. Weryfikacja e-mail (symulacja przez bezpośrednią aktualizację bazy) ──

  it('2. Weryfikacja e-mail — symulacja przez aktualizację bazy', async () => {
    const updated = await prisma.user.update({
      where: { email: testUser.email },
      data: { isVerified: true },
    });

    expect(updated.isVerified).toBe(true);
  });

  // ── 3. Logowanie ────────────────────────────────────────────────────────────

  it('3. Logowanie — POST /api/auth/login → 200 z accessToken', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body.accessToken.length).toBeGreaterThan(0);

    // Zapisz token do dalszych testów
    accessToken = res.body.accessToken;
  });

  // ── 4. Pobieranie profilu ───────────────────────────────────────────────────

  it('4. Pobieranie profilu — GET /api/users/me → 200', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(testUser.email);
    expect(res.body.username).toBe(testUser.username);
    // Hasło nie powinno być zwracane
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  // ── 5. Tworzenie znaleziska ─────────────────────────────────────────────────

  it('5. Tworzenie znaleziska — POST /api/finds → 201', async () => {
    const findData = {
      name: `Moneta testowa ${timestamp}`,
      description: 'Opis testowego znaleziska',
      discoveryDate: '2024-06-15T10:00:00.000Z',
      latitude: 52.2297,
      longitude: 21.0122,
    };

    const res = await request(app)
      .post('/api/finds')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(findData)
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe(findData.name);
    expect(res.body.description).toBe(findData.description);
    expect(res.body.latitude).toBe(findData.latitude);
    expect(res.body.longitude).toBe(findData.longitude);
    expect(res.body).toHaveProperty('photos');
    expect(res.body).toHaveProperty('attributes');

    // Zapisz ID do dalszych testów
    findId = res.body.id;
  });

  // ── 6. Pobieranie znaleziska ────────────────────────────────────────────────

  it('6. Pobieranie znaleziska — GET /api/finds/:id → 200', async () => {
    const res = await request(app)
      .get(`/api/finds/${findId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(findId);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('photos');
    expect(res.body).toHaveProperty('attributes');
  });

  // ── 7. Listowanie znalezisk z paginacją ────────────────────────────────────

  it('7. Listowanie znalezisk — GET /api/finds → 200 z paginacją', async () => {
    const res = await request(app)
      .get('/api/finds?page=1&limit=20')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    // Sprawdź strukturę paginacji
    const { pagination } = res.body;
    expect(pagination).toHaveProperty('page');
    expect(pagination).toHaveProperty('limit');
    expect(pagination).toHaveProperty('total');
    expect(pagination).toHaveProperty('totalPages');
    expect(pagination.page).toBe(1);
    expect(pagination.limit).toBe(20);
    expect(pagination.total).toBeGreaterThanOrEqual(1);

    // Sprawdź że nasze znalezisko jest na liście
    const ourFind = res.body.data.find((f: { id: string }) => f.id === findId);
    expect(ourFind).toBeDefined();
  });

  // ── 8. Dodawanie atrybutu ───────────────────────────────────────────────────

  it('8. Dodawanie atrybutu — POST /api/finds/:id/attributes → 201', async () => {
    const attributeData = {
      key: 'Materiał',
      value: 'Srebro',
    };

    const res = await request(app)
      .post(`/api/finds/${findId}/attributes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(attributeData)
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.key).toBe(attributeData.key);
    expect(res.body.value).toBe(attributeData.value);
    expect(res.body.findId).toBe(findId);

    // Zapisz ID atrybutu
    attributeId = res.body.id;
  });

  // ── 8b. Weryfikacja że atrybut jest widoczny w znalezisku ──────────────────

  it('8b. Atrybut widoczny w szczegółach znaleziska', async () => {
    const res = await request(app)
      .get(`/api/finds/${findId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.attributes)).toBe(true);
    expect(res.body.attributes.length).toBeGreaterThanOrEqual(1);

    const attr = res.body.attributes.find((a: { id: string }) => a.id === attributeId);
    expect(attr).toBeDefined();
    expect(attr.key).toBe('Materiał');
    expect(attr.value).toBe('Srebro');
  });

  // ── 9. Usuwanie znaleziska ──────────────────────────────────────────────────

  it('9. Usuwanie znaleziska — DELETE /api/finds/:id → 204', async () => {
    const res = await request(app)
      .delete(`/api/finds/${findId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);
  });

  // ── 9b. Weryfikacja że znalezisko zostało usunięte ─────────────────────────

  it('9b. Znalezisko niedostępne po usunięciu — GET /api/finds/:id → 404', async () => {
    const res = await request(app)
      .get(`/api/finds/${findId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(404);
  });

  // ── 10. Wylogowanie ─────────────────────────────────────────────────────────

  it('10. Wylogowanie — POST /api/auth/logout → 204', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);
  });
});

// ── Testy dodatkowe: walidacja i obsługa błędów ───────────────────────────────

describe('E2E: Walidacja i obsługa błędów', () => {
  it('Rejestracja z zajętym e-mailem → 409', async () => {
    // Najpierw zarejestruj użytkownika
    const dupTimestamp = Date.now() + 1;
    const dupUser = {
      email: `dup-${dupTimestamp}@example.com`,
      username: `dupuser${dupTimestamp}`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
    };

    await request(app).post('/api/auth/register').send(dupUser);

    // Próba rejestracji z tym samym e-mailem
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...dupUser, username: `other${dupTimestamp}` })
      .set('Accept', 'application/json');

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('AUTH_EMAIL_ALREADY_EXISTS');

    // Sprzątanie
    await prisma.user.deleteMany({ where: { email: dupUser.email } });
  });

  it('Logowanie z błędnym hasłem → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nieistniejacy@example.com', password: 'WrongPassword123!' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('Dostęp do chronionego zasobu bez tokenu → 401', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Accept', 'application/json');

    expect(res.status).toBe(401);
  });

  it('Tworzenie znaleziska bez nazwy → 400', async () => {
    // Potrzebujemy tymczasowego tokenu — zarejestruj i zaloguj
    const tmpTimestamp = Date.now() + 2;
    const tmpUser = {
      email: `tmp-${tmpTimestamp}@example.com`,
      username: `tmpuser${tmpTimestamp}`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
    };

    await request(app).post('/api/auth/register').send(tmpUser);
    await prisma.user.update({
      where: { email: tmpUser.email },
      data: { isVerified: true },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: tmpUser.email, password: tmpUser.password });

    const tmpToken = loginRes.body.accessToken;

    const res = await request(app)
      .post('/api/finds')
      .set('Authorization', `Bearer ${tmpToken}`)
      .send({ description: 'Brak nazwy' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);

    // Sprzątanie
    await prisma.user.deleteMany({ where: { email: tmpUser.email } });
  });

  it('Health check — GET /health → 200', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
