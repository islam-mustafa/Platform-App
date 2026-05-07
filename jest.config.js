module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
};