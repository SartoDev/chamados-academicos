import type { Config } from 'jest';
import {
  baseProjectConfig,
  COVERAGE_REPORTERS,
  COVERAGE_SOURCES,
  COVERAGE_THRESHOLDS,
  GUARDS_THRESHOLD_KEY,
  SERVICES_THRESHOLD_KEY,
} from './jest.shared.ts';

/**
 * Integration tests against a real NestJS application and a real PostgreSQL
 * (`docker compose --profile test up -d postgres-test`, `DATABASE_URL_TEST`).
 * Run with `--runInBand`: every suite shares the same test database.
 *
 * Each run declares the thresholds its own tests sustain, and every threshold is enforced
 * where the code it guards is actually exercised, with the same values in every run:
 * - here, the global floor, the guards and the services, all exercised end to end;
 * - the pure rules of U2 are decided in memory, so they are covered by the unit run, which
 *   enforces their threshold, and by the combined run, which sees both projects at once.
 */
const config: Config = {
  ...baseProjectConfig,
  displayName: 'integration',
  testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
  globalSetup: '<rootDir>/test/integration/global-setup.ts',
  testTimeout: 30_000,
  coverageProvider: 'v8',
  collectCoverageFrom: COVERAGE_SOURCES,
  coverageDirectory: '<rootDir>/coverage/integration',
  coverageReporters: COVERAGE_REPORTERS,
  coverageThreshold: {
    global: COVERAGE_THRESHOLDS.global,
    [GUARDS_THRESHOLD_KEY]: COVERAGE_THRESHOLDS[GUARDS_THRESHOLD_KEY],
    [SERVICES_THRESHOLD_KEY]: COVERAGE_THRESHOLDS[SERVICES_THRESHOLD_KEY],
  },
};

export default config;
