module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.{js}',
    '!src/server.js',
    '!src/tests/**',
    '!src/**/*.test.js',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
  ],
  transform: {
    '^.+\\.(js)$': 'babel-jest',
  },
  testTimeout: 10000,
};
