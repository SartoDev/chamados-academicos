import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

interface ProjectConfigLike {
  rootDir: string;
}

/**
 * Applies every migration to the test database once, before the integration suites run.
 * Jest loads this file outside the ESM test runtime, so it only imports Node built-ins.
 */
export default function globalSetup(
  _globalConfig: unknown,
  projectConfig: ProjectConfigLike,
): void {
  const apiRoot = projectConfig.rootDir;
  const envFile = resolve(apiRoot, '..', '..', '.env');
  if (existsSync(envFile)) {
    // Local, git-ignored settings; variables already present in the environment win.
    process.loadEnvFile(envFile);
  }
  const databaseUrl = process.env.DATABASE_URL_TEST;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL_TEST is not set. Start the test database with ' +
        '"docker compose --profile test up -d postgres-test" and define DATABASE_URL_TEST in .env.',
    );
  }
  execSync('npx prisma migrate deploy', {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    stdio: 'inherit',
  });
}
