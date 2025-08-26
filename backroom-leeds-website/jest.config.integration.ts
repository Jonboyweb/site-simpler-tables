import type { Config } from '@jest/types';

const integrationConfig: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '**/tests/reporting/integration/**/*.test.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: './coverage/integration',
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  verbose: true,
  maxWorkers: '50%', // Use half the available CPU cores
  setupFilesAfterEnv: ['<rootDir>/tests/reporting/integration/setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
      diagnostics: {
        warnOnly: true,
      },
    },
  },
  // Performance and timeout configurations
  testTimeout: 300000, // 5 minutes max for integration tests
  slowTestThreshold: 60000, // Mark tests over 1 minute as slow
};

export default integrationConfig;