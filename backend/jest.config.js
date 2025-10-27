module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '/tests/.*\\.test\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  rootDir: '.',
  setupFilesAfterEnv: ['./jest.setup.js'],
  globalTeardown: './jest.teardown.js',
};
