import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Testy integracyjne wymagają działającej bazy danych
    // Uruchom: npm run test --workspace=backend
    include: ['src/**/*.test.ts'],
    // Sekwencyjne wykonanie testów (nie równoległe) — ważne dla testów E2E
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
