module.exports = {
  testEnvironment: "node",

  restoreMocks: false,

  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
  ],

  coverageDirectory: "coverage",

  coverageReporters: [
    "text",
    "text-summary",
    "lcov",
  ],

  testMatch: [
    "**/tests/**/*.test.js",
  ],

  moduleFileExtensions: [
    "js",
    "json",
  ],
};