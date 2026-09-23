jest.mock('../src/app', () => ({ listen: jest.fn((port, host, cb) => cb && cb()) }));
jest.mock('../src/config/db', () => jest.fn());

describe('user server', () => {
  beforeEach(() => jest.resetModules());

  test('starts after database connection', async () => {
    const db = require('../src/config/db');
    const app = require('../src/app');
    db.mockResolvedValue(undefined);
    require('../src/server');
    await new Promise((r) => setImmediate(r));
    expect(db).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalled();
  });

  test('logs startup failure and exits when database connection fails', async () => {
    const db = require('../src/config/db');
    const app = require('../src/app');
    db.mockRejectedValue(new Error('db down'));
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    require('../src/server');
    await new Promise((r) => setImmediate(r));
    expect(error).toHaveBeenCalledWith('Startup failed:', expect.any(Error));
    expect(exit).toHaveBeenCalledWith(1);
    expect(app.listen).not.toHaveBeenCalled();
    error.mockRestore();
    exit.mockRestore();
  });
});

