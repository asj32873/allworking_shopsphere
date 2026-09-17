const { ok, fail } = require('../../utils/apiResponse');

describe('user apiResponse', () => {
  test('ok uses defaults', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };
    expect(ok(res, { id: 1 })).toEqual(undefined);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ success: true, message: 'OK', data: { id: 1 } });
  });

  test('ok accepts custom message and status', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };
    ok(res, 'data', 'Created', 201);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ success: true, message: 'Created', data: 'data' });
  });

  test('fail without details', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    fail({ status }, 'Bad', 400);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ success: false, message: 'Bad' });
  });

  test('fail includes details when supplied', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    fail({ status }, 'Invalid', 422, { field: 'name' });
    expect(json).toHaveBeenCalledWith({ success: false, message: 'Invalid', details: { field: 'name' } });
  });
});
