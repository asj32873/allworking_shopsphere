describe('user env', () => {
  beforeEach(() => jest.resetModules());

  test('getEnv reads process environment', () => {
    process.env.USER_TEST_ENV = 'hello';
    const { getEnv } = require('../../src/config/env');
    expect(getEnv('USER_TEST_ENV')).toBe('hello');
    delete process.env.USER_TEST_ENV;
  });

  test('getEnv returns fallback for missing value', () => {
    delete process.env.USER_MISSING_ENV;
    const { getEnv } = require('../../src/config/env');
    expect(getEnv('USER_MISSING_ENV', 'fallback')).toBe('fallback');
    expect(getEnv('USER_MISSING_ENV')).toBeUndefined();
  });
});
