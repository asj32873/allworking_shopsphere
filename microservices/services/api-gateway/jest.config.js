module.exports = {
  testEnvironment: "node",

  testMatch: ["**/tests/**/*.test.js"],

  collectCoverage: true,

  collectCoverageFrom: ["src/server.js"],

  coverageDirectory: "coverage",

  coverageReporters: ["text", "lcov"],

  coveragePathIgnorePatterns: ["/node_modules/", "/coverage/"],
};
