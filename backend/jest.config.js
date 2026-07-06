module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^uuid$': '<rootDir>/__mocks__/uuid.js',
    '^ioredis$': '<rootDir>/__mocks__/ioredis.js',
  },
};
