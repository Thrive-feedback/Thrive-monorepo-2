import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig, type ViteUserConfig } from 'vitest/config';

/**
 * The shared base for component suites.
 *
 * A function returning a config object, so importing it starts no watcher, reads no
 * environment, and touches no disk. It lives in a package, not inline in its one consumer
 * today, so a second workspace shares it rather than copying it.
 */
export function reactTestConfig(
  options: { setupFiles?: string[] } = {},
): ViteUserConfig {
  return defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
      // Queries go through the accessibility tree, which needs a DOM.
      environment: 'jsdom',
      // Tests import `describe` and `it` like any other module; nothing is injected as a global.
      globals: false,
      setupFiles: options.setupFiles ?? [],
      css: false,
      // Shuffled so no test can come to depend on another running first.
      sequence: { shuffle: true },
      clearMocks: true,
      restoreMocks: true,
    },
  });
}
