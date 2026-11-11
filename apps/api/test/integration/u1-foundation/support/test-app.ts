import type { Type } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModule, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../../../src/app.module.js';
import { configureApp } from '../../../../src/app.setup.js';
import { Clock } from '../../../../src/common/clock.js';
import { PrismaService } from '../../../../src/common/prisma/prisma.service.js';
import { APP_CONFIG, loadConfig, type Environment } from '../../../../src/config/app-config.js';
import { SeedService } from '../../../../src/seed/seed.service.js';
import { FakeClock } from '../../../support/fake-clock.js';
import { requireTestDatabaseUrl } from '../../support/test-env.js';
import { truncateU1Tables } from './database.js';

/** Fake, test-only settings. No real secret is ever used by the test suites. */
export const TEST_APP_ORIGIN = 'http://localhost:8080';
export const TEST_JWT_SECRET = 'integration-test-only-secret-with-enough-length-0001';
export const TEST_INITIAL_ADMIN_EMAIL = 'initial.admin@example.test';
export const TEST_INITIAL_ADMIN_PASSWORD = 'InitialAdmin123';

export function buildTestEnvironment(overrides: Environment = {}): Environment {
  return {
    DATABASE_URL: requireTestDatabaseUrl(),
    JWT_SECRET: TEST_JWT_SECRET,
    APP_ORIGIN: TEST_APP_ORIGIN,
    COOKIE_SECURE: 'false',
    INITIAL_ADMIN_EMAIL: TEST_INITIAL_ADMIN_EMAIL,
    INITIAL_ADMIN_PASSWORD: TEST_INITIAL_ADMIN_PASSWORD,
    ...overrides,
  };
}

export interface TestApp {
  app: NestExpressApplication;
  moduleRef: TestingModule;
  prisma: PrismaService;
  seed: SeedService;
  clock: FakeClock;
  close(): Promise<void>;
}

export interface TestAppOptions {
  env?: Environment;
  /** Extra controllers registered next to AppModule, e.g. a probe route without role marker. */
  controllers?: Type<unknown>[];
  customize?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
}

/**
 * Builds the real NestJS application (same pipeline as main.ts) connected to the test
 * database, with a controllable clock. Initialization runs the initial load, like startup.
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  const clock = new FakeClock();
  let builder = Test.createTestingModule({
    imports: [AppModule],
    controllers: options.controllers ?? [],
  })
    .overrideProvider(APP_CONFIG)
    .useValue(loadConfig(buildTestEnvironment(options.env)))
    .overrideProvider(Clock)
    .useValue(clock);
  if (options.customize) {
    builder = options.customize(builder);
  }
  const moduleRef = await builder.compile();
  // Start every suite from empty U1 tables, whatever a previous suite left behind, so the
  // initial load that runs during init() always sees a clean database.
  await truncateU1Tables(moduleRef.get(PrismaService));
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bodyParser: false,
    logger: false,
  });
  configureApp(app);
  await app.init();
  return {
    app,
    moduleRef,
    prisma: app.get(PrismaService),
    seed: app.get(SeedService),
    clock,
    close: () => app.close(),
  };
}
