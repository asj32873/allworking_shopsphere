/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",

  testMatch: [
    "<rootDir>/tests/**/*.test.js",
    "<rootDir>/tests/**/*.spec.js"
  ],

  collectCoverageFrom: [
    "services/**/src/**/*.js",

    "!services/**/src/**/tests/**",
    "!services/**/src/**/test/**",
    "!services/**/src/server.js",
    "!services/**/src/app.js",
    "!services/**/src/create-admin.js",
    "!services/**/src/config/**"
  ],

  coverageDirectory: "<rootDir>/coverage",

  coverageReporters: [
    "text",
    "text-summary",
    "lcov",
    "html"
  ],

  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/coverage/"
  ]
};
