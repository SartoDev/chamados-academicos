import type { Config } from 'jest';
import {
  baseProjectConfig,
  COVERAGE_REPORTERS,
  COVERAGE_SOURCES,
  COVERAGE_THRESHOLDS,
  GUARDS_THRESHOLD_KEY,
  U2_RULES_THRESHOLD_KEY,
} from './jest.shared.ts';

/**
 * Fast unit tests (`*.spec.ts` next to the code), no database. Run by the pre-push hook.
 * Services that read or write business data are covered by the integration suite against
 * a real PostgreSQL (no Prisma mocks), so this run enforces the thresholds of the code that
 * unit tests do exercise — guards and the pure rules of U2; the full set of thresholds is
 * enforced by the integration and the combined runs.
 */
const config: Config = {
  ...baseProjectConfig,
  displayName: 'unit',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  coverageProvider: 'v8',
  collectCoverageFrom: COVERAGE_SOURCES,
  coverageDirectory: '<rootDir>/coverage/unit',
  coverageReporters: COVERAGE_REPORTERS,
  coverageThreshold: {
    global: {},
    [GUARDS_THRESHOLD_KEY]: COVERAGE_THRESHOLDS[GUARDS_THRESHOLD_KEY],
    [U2_RULES_THRESHOLD_KEY]: COVERAGE_THRESHOLDS[U2_RULES_THRESHOLD_KEY],
  },
};

export default config;
