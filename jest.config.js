module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  moduleDirectories: ["node_modules", "src"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  // Look for test files with .test.ts or .spec.ts under the tests folder
  testMatch: ['**/tests/**/*.(test|spec).ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
}; 