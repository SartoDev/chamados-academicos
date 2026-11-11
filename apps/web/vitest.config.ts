import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        // Scaffolding and generated shadcn components have no coverage floor (team.md).
        exclude: [
          'src/main.tsx',
          'src/components/ui/**',
          'src/test/**',
          'src/**/*.test.{ts,tsx}',
          'src/**/*.d.ts',
        ],
        reporter: ['text', 'text-summary', 'json-summary', 'lcov'],
        reportsDirectory: './coverage',
        // Feature scope floor of the approved plan; never lowered to make a run pass.
        thresholds: { lines: 80 },
      },
    },
  }),
);
