module.exports = {
  testEnvironment: "jsdom",

  roots: ["<rootDir>/src", "<rootDir>/tests"],

  moduleFileExtensions: ["js", "jsx", "json"],

  testMatch: ["**/tests/**/*.test.[jt]s?(x)"],

  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],

  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/tests/mocks/styleMock.cjs",

    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/tests/mocks/styleMock.cjs",
  },

  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  transformIgnorePatterns: ["/node_modules/"],

  clearMocks: true,
  restoreMocks: true,

  collectCoverage: false,

  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/main.jsx",
    "!src/**/*.txt",
    // dead/legacy code, superseded by Redux store + AppBootstrap
    "!src/context/AppContext.jsx",
    "!src/data/dummyData.js",
  ],

  coverageDirectory: "coverage",

  coverageReporters: ["text", "text-summary", "lcov"],
};
