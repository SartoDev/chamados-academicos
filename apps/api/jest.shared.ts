import path from 'node:path';
import type { Config } from 'jest';

/**
 * Shared Jest settings for the API. The API is an ES module package (NestJS 12), so Jest runs
 * in ESM mode: `--experimental-vm-modules` comes from `node-options` in the root `.npmrc`.
 * @swc/jest keeps decorator metadata, which NestJS dependency injection needs.
 */
export const baseProjectConfig: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        module: { type: 'es6' },
        sourceMaps: 'inline',
        jsc: {
          target: 'es2023',
          keepClassNames: true,
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
        },
      },
    ],
  },
};

/** Non-scaffolding code of the API. Scaffolding has no coverage floor (team.md). */
export const COVERAGE_SOURCES = [
  'src/**/*.ts',
  '!src/**/*.spec.ts',
  '!src/main.ts',
  '!src/**/*.module.ts',
  '!src/**/*.dto.ts',
  '!src/common/prisma/prisma.service.ts',
  '!src/generated/**',
  '!src/openapi/**',
];

/**
 * Jest expands path/glob threshold keys against the process working directory, not `rootDir`.
 * The keys are anchored to this package so the thresholds apply identically when Jest runs from
 * the repository root (documented commands) and from `apps/api` (npm scripts).
 */
const API_ROOT = import.meta.dirname.split(path.sep).join('/');

export const GUARDS_THRESHOLD_KEY = `${API_ROOT}/src/**/guards/**/*.ts`;
export const SERVICES_THRESHOLD_KEY = `${API_ROOT}/src/**/*.service.ts`;
/**
 * Authorization, visibility, transition, conversation-access and reporting rules, which live
 * outside `guards/`. U3 and then U4 widened the reach of this key to their own `rules/` folder,
 * with the same values.
 */
export const RULES_THRESHOLD_KEY = `${API_ROOT}/src/{tickets,notifications,conversation,reporting}/rules/**/*.ts`;
/** Name kept for the run configurations that already import it; same key, wider reach. */
export const U2_RULES_THRESHOLD_KEY = RULES_THRESHOLD_KEY;

/**
 * Coverage obligations of the approved plan, never lowered to make a run pass:
 * - global: 80% lines on non-scaffolding code (feature scope floor);
 * - guards and authorization rules: 90% branches per file (team.md), plus 80% lines so the
 *   files Jest removes from the global aggregate keep a line floor;
 * - services: 80% lines per file (team.md).
 */
export const COVERAGE_THRESHOLDS: NonNullable<Config['coverageThreshold']> = {
  global: { lines: 80 },
  [GUARDS_THRESHOLD_KEY]: { branches: 90, lines: 80 },
  [RULES_THRESHOLD_KEY]: { branches: 90, lines: 80 },
  [SERVICES_THRESHOLD_KEY]: { lines: 80 },
};

export const COVERAGE_REPORTERS: NonNullable<Config['coverageReporters']> = [
  'text',
  'text-summary',
  'json-summary',
  'lcov',
];
