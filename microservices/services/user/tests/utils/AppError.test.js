const AppError = require('../../src/utils/AppError');

describe('user AppError', () => {
  test('constructor defaults and custom options', () => {
    const e = new AppError('boom');
    expect(e.name).toBe('AppError');
    expect(e.statusCode).toBe(500);
    expect(e.code).toBe('INTERNAL_SERVER_ERROR');
    expect(e.isOperational).toBe(true);

    const custom = new AppError('bad', 400, { code: 'CUSTOM', details: { x: 1 }, isOperational: false });
    expect(custom).toMatchObject({ name: 'AppError', statusCode: 400, code: 'CUSTOM', details: { x: 1 }, isOperational: false });
  });

  test('static factories', () => {
    expect(AppError.badRequest('bad', { a: 1 })).toMatchObject({ statusCode: 400, code: 'BAD_REQUEST', details: { a: 1 } });
    expect(AppError.unauthorized()).toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' });
    expect(AppError.unauthorized('No')).toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED', message: 'No' });
    expect(AppError.forbidden()).toMatchObject({ statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden' });
    expect(AppError.notFound()).toMatchObject({ statusCode: 404, code: 'NOT_FOUND', message: 'Resource not found' });
    expect(AppError.conflict('Conflict', { id: 2 })).toMatchObject({ statusCode: 409, code: 'CONFLICT', details: { id: 2 } });
    expect(AppError.serviceUnavailable()).toMatchObject({ statusCode: 503, code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' });
  });
});
