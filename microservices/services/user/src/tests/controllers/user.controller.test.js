jest.mock('../../utils/serviceClient', () => ({
  getJson: jest.fn(),
  patchJson: jest.fn(),
}));
jest.mock('../../utils/apiResponse', () => ({
  ok: jest.fn(),
  fail: jest.fn(),
}));

const { getJson, patchJson } = require('../../utils/serviceClient');
const { ok } = require('../../utils/apiResponse');
const { me, update } = require('../../controllers/user.controller');

function res() {
  return { status: jest.fn(() => ({ json: jest.fn() })) };
}

describe('user controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SERVICE_URL = 'http://auth.example/';
  });

  afterEach(() => delete process.env.AUTH_SERVICE_URL);

  test('me returns downstream user data', async () => {
    getJson.mockResolvedValue({ ok: true, status: 200, data: { data: { id: 'u1', name: 'A' } } });
    const response = res();
    await me({ user: { id: 'u1' } }, response);
    expect(getJson).toHaveBeenCalledWith('http://auth.example/', '/internal/users/u1');
    expect(ok).toHaveBeenCalledWith(response, { id: 'u1', name: 'A' });
  });

  test('me forwards downstream failure', async () => {
    getJson.mockResolvedValue({ ok: false, status: 503, data: { success: false, message: 'down' } });
    const response = res();
    await me({ user: { id: 'u2' } }, response);
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.status.mock.results[0].value.json).toHaveBeenCalledWith({ success: false, message: 'down' });
  });

  test('update sends only allowed defined fields', async () => {
    patchJson.mockResolvedValue({ ok: true, status: 200, data: { data: { id: 'u1', name: 'New' } } });
    const response = res();
    await update({ user: { id: 'u1' }, body: { name: 'New', phone: '123', email: 'evil@example.com', ignored: undefined } }, response);
    expect(patchJson).toHaveBeenCalledWith('http://auth.example/', '/internal/users/u1', { name: 'New', phone: '123' });
    expect(ok).toHaveBeenCalledWith(response, { id: 'u1', name: 'New' }, 'Profile updated.');
  });

  test('update works with no allowed fields', async () => {
    patchJson.mockResolvedValue({ ok: true, status: 200, data: { data: { id: 'u1' } } });
    await update({ user: { id: 'u1' }, body: { email: 'x' } }, res());
    expect(patchJson).toHaveBeenCalledWith('http://auth.example/', '/internal/users/u1', {});
  });

  test('update forwards downstream failure', async () => {
    patchJson.mockResolvedValue({ ok: false, status: 400, data: { success: false, message: 'invalid' } });
    const response = res();
    await update({ user: { id: 'u1' }, body: { name: 'x' } }, response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.status.mock.results[0].value.json).toHaveBeenCalledWith({ success: false, message: 'invalid' });
  });
});
