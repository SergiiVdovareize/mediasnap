import type { Config } from 'jest';

const runIntegration = process.argv.some(arg => arg.includes('integration'));

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: runIntegration
    ? ['<rootDir>/tests/integration/**/*.test.ts']
    : ['<rootDir>/tests/unit/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: { lines: 90, functions: 90 },
  },
};

export default config;
