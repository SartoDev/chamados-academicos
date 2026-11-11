import type { Config } from 'jest';
import { COVERAGE_REPORTERS, COVERAGE_SOURCES, COVERAGE_THRESHOLDS } from './jest.shared.ts';

/**
 * Combined run of the unit and integration projects with merged coverage. This is the
 * authoritative coverage gate: `npm run test:coverage -w apps/api` (uses `--runInBand`).
 */
const config: Config = {
  rootDir: '.',
  projects: ['<rootDir>/jest.unit.config.ts', '<rootDir>/jest.integration.config.ts'],
  coverageProvider: 'v8',
  collectCoverageFrom: COVERAGE_SOURCES,
  coverageDirectory: '<rootDir>/coverage/all',
  coverageReporters: COVERAGE_REPORTERS,
  coverageThreshold: COVERAGE_THRESHOLDS,
};

export default config;
