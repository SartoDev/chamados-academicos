import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { AppModule } from '../../../src/app.module.js';
import { PrismaService } from '../../../src/common/prisma/prisma.service.js';
import { ConfigValidationError } from '../../../src/config/app-config.js';
import { InitialLoadError } from '../../../src/seed/seed.service.js';
import { resetToInitialLoad, truncateU1Tables } from './support/database.js';
import { activeStudent } from './support/factories.js';
import {
  buildTestEnvironment,
  createTestApp,
  TEST_INITIAL_ADMIN_EMAIL,
  type TestApp,
} from './support/test-app.js';

const REQUIRED_VARIABLES = [
  'DATABASE_URL',
  'JWT_SECRET',
  'APP_ORIGIN',
  'INITIAL_ADMIN_EMAIL',
  'INITIAL_ADMIN_PASSWORD',
] as const;

const originalEnv = { ...process.env };

function useEnvironment(env: Record<string, string | undefined>): void {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, env);
}

/** Starts the real AppModule reading process.env, exactly like main.ts does. */
async function startApplication(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  try {
    await app.init();
  } catch (error) {
    // Release connections opened before the failure, as the real process would on exit.
    await app.close();
    throw error;
  }
  return app;
}

async function expectStartupFailure(): Promise<Error> {
  let app: NestExpressApplication | undefined;
  try {
    app = await startApplication();
  } catch (error) {
    return error as Error;
  }
  await app.close();
  throw new Error('Expected the application startup to fail');
}

describe('application startup (WF9, BR5.3)', () => {
  // Support application used only to prepare and restore database state around the cases.
  let supportApp: TestApp;

  beforeAll(async () => {
    supportApp = await createTestApp();
  });

  afterAll(async () => {
    await supportApp.close();
  });

  afterEach(() => {
    useEnvironment(originalEnv);
  });

  it.each(REQUIRED_VARIABLES)('does not start without %s and names it', async (variable) => {
    const env = buildTestEnvironment();
    delete env[variable];
    useEnvironment(env);

    const error = await expectStartupFailure();

    expect(error).toBeInstanceOf(ConfigValidationError);
    expect(error.message).toContain(variable);
  });

  it('does not start when the initial admin password violates the policy, without echoing it', async () => {
    const weakPassword = 'abcdefgh';
    useEnvironment(buildTestEnvironment({ INITIAL_ADMIN_PASSWORD: weakPassword }));

    const error = await expectStartupFailure();

    expect(error).toBeInstanceOf(ConfigValidationError);
    expect(error.message).toContain('INITIAL_ADMIN_PASSWORD');
    expect(error.message).not.toContain(weakPassword);
  });

  it('never prints the value of a misconfigured secret', async () => {
    const shortSecret = 'too-short-secret';
    useEnvironment(buildTestEnvironment({ JWT_SECRET: shortSecret }));

    const error = await expectStartupFailure();

    expect(error.message).toContain('JWT_SECRET');
    expect(error.message).not.toContain(shortSecret);
  });

  it('starts and runs the initial load when the configuration is valid', async () => {
    await truncateU1Tables(supportApp.prisma);
    useEnvironment(buildTestEnvironment());

    const app = await startApplication();
    try {
      const prisma = app.get(PrismaService);
      expect(await prisma.status.count()).toBe(4);
      expect(await prisma.priority.count()).toBe(3);
      expect(await prisma.user.count({ where: { role: 'ADMIN', active: true } })).toBe(1);
    } finally {
      await app.close();
    }
  });

  describe('when the initial admin e-mail belongs to another user', () => {
    beforeAll(async () => {
      await truncateU1Tables(supportApp.prisma);
      await activeStudent(supportApp.prisma, { email: TEST_INITIAL_ADMIN_EMAIL });
    });

    afterAll(async () => {
      await resetToInitialLoad(supportApp.prisma, supportApp.seed);
    });

    it('does not start and explains why', async () => {
      useEnvironment(buildTestEnvironment());

      const error = await expectStartupFailure();

      expect(error).toBeInstanceOf(InitialLoadError);
      expect(error.message).toContain('INITIAL_ADMIN_EMAIL');
    });
  });
});
