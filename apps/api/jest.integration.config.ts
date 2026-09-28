import type { Config } from 'jest';
import { nestConfig } from '@repo/jest-config';

export default {
  ...nestConfig,
  testRegex: '.*\\.integration-spec\\.ts$',
  collectCoverage: false,
  randomize: true,
  setupFilesAfterEnv: ['<rootDir>/../test/support/reset-ids.ts'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/$1',
    '^@test/(.*)$': '<rootDir>/../test/$1',
  },
} satisfies Config;
