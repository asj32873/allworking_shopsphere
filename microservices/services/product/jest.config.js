module.exports = {
  testEnvironment: "node",

  roots: ["<rootDir>/tests"],

  testMatch: [
    "**/tests/**/*.test.js",
  ],

  collectCoverage: true,

  collectCoverageFrom: [
    "src/**/*.js",
    "!src/tests/**",
    "!src/server.js",
  ],

  coverageDirectory: "coverage",

  coverageReporters: [
    "text",
    "text-summary",
    "lcov",
  ],

  clearMocks: true,
  restoreMocks: true,
};