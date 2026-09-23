/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/create-admin.js",
    "!src/config/**"
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "text-summary", "lcov", "html"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/coverage/"
  ]
};
