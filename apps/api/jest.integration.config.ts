import type { Config } from 'jest';
import { nestConfig } from '@repo/jest-config';

export default {
  ...nestConfig,
  testRegex: '.*\\.integration-spec\\.ts$',
  collectCoverage: false,
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/$1',
    '^@test/(.*)$': '<rootDir>/../test/$1',
  },
} satisfies Config;
