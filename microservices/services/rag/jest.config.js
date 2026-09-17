module.exports = {
  testEnvironment: "node",

  testMatch: ["**/tests/**/*.test.js"],

  collectCoverage: true,

  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/config/**",
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