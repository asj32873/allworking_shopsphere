module.exports = {
  testEnvironment: "node",

  clearMocks: true,
  restoreMocks: true,

  collectCoverageFrom: ["src/**/*.js", "!src/server.js", "!src/env.js"],

  coverageDirectory: "coverage",

  coverageReporters: ["text", "text-summary", "lcov"],

  testMatch: ["**/tests/**/*.test.js"],

  moduleFileExtensions: ["js", "json"],
};
