module.exports={testEnvironment:"node",collectCoverageFrom:["src/**/*.js","!src/server.js"],coverageDirectory:"coverage",coverageReporters:["text","text-summary","lcov"],testMatch:["**/tests/**/*.test.js"],moduleFileExtensions:["js","json"],clearMocks:true,restoreMocks:true};
module.exports = {
  testEnvironment: "node",

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

  clearMocks: true,
  restoreMocks: true,
};