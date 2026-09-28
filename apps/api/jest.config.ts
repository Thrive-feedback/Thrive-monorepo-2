import type { Config } from 'jest';
import { nestConfig } from '@repo/jest-config';

/**
 * The fast suite: unit tests only. The integration suite runs separately, so this feedback
 * loop never waits on anything that touches a real store.
 */
export default {
  ...nestConfig,
  testPathIgnorePatterns: ['\\.integration-spec\\.ts$'],
  // Surfaces any test that only passes because another ran first.
  randomize: true,
  setupFilesAfterEnv: ['<rootDir>/../test/support/reset-ids.ts'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/$1',
    '^@test/(.*)$': '<rootDir>/../test/$1',
  },
} satisfies Config;
