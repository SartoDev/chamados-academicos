import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../../../../', import.meta.url));
export const API_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

/** Loads the local, git-ignored `.env` when present; variables already set take precedence. */
export function loadLocalEnvFile(): void {
  const envFile = `${REPOSITORY_ROOT}.env`;
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
}

export function requireTestDatabaseUrl(): string {
  loadLocalEnvFile();
  const url = process.env.DATABASE_URL_TEST;
  if (!url) {
    throw new Error(
      'DATABASE_URL_TEST is not set. Start the test database with ' +
        '"docker compose --profile test up -d postgres-test" and define DATABASE_URL_TEST in .env.',
    );
  }
  return url;
}
