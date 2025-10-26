module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testRegex: '/tests/.*\\.test\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  rootDir: '.',
};
