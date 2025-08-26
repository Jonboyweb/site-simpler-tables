/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/email/**/*.test.ts',
    '**/tests/email/**/*.test.tsx'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup-email-tests.ts'],
  coverageDirectory: '<rootDir>/coverage/email',
  collectCoverageFrom: [
    'src/lib/email/**/*.{ts,tsx}',
    'src/services/email/**/*.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test-results/email' }]
  ]
}