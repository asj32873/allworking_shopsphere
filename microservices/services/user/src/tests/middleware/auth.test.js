let mockJwksClient;
jest.mock('../../utils/serviceClient', () => ({ getJson: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('jwks-rsa', () => jest.fn(() => {
  mockJwksClient = { getSigningKey: jest.fn() };
  return mockJwksClient;
}));

function load() {
  jest.resetModules();
  mockJwksClient = undefined;
  const jwt = require('jsonwebtoken');
  const { getJson } = require('../../utils/serviceClient');
  const auth = require('../../middleware/auth');
  return { jwt, getJson, auth, jwks: mockJwksClient };
}

function response() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json };
}

describe('user auth middleware', () => {
  beforeEach(() => {
    delete process.env.AUTH0_DOMAIN;
    delete process.env.AUTH0_AUDIENCE;
    process.env.JWT_SECRET = 'secret';
    process.env.AUTH_SERVICE_URL = 'http://auth.example';
    jest.clearAllMocks();
  });

  test('requires Bearer authentication', async () => {
    const { auth } = load(); const res = response(); const next = jest.fn();
    await auth.authenticate({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Authentication required.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects malformed authorization scheme', async () => {
    const { auth } = load(); const res = response();
    await auth.authenticate({ headers: { authorization: 'Basic abc' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('authenticates with normal JWT and loads user', async () => {
    const { auth, jwt, getJson } = load();
    jwt.verify.mockReturnValue({ id: 'u1', role: 'USER' });
    getJson.mockResolvedValue({ ok: true, data: { data: { id: 'u1', role: 'USER', status: 'ACTIVE' } } });
    const req = { headers: { authorization: 'Bearer token' } }; const res = response(); const next = jest.fn();
    await auth.authenticate(req, res, next);
    expect(getJson).toHaveBeenCalledWith('http://auth.example', '/internal/users/u1');
    expect(req.user.id).toBe('u1'); expect(req.auth).toMatchObject({ id: 'u1' }); expect(next).toHaveBeenCalled();
  });

  test('uses default auth service and URL-encodes user id', async () => {
    delete process.env.AUTH_SERVICE_URL;
    const { auth, jwt, getJson } = load();
    jwt.verify.mockReturnValue({ id: 'u/a b' });
    getJson.mockResolvedValue({ ok: true, data: { data: { id: 'u/a b', role: 'USER', status: 'ACTIVE' } } });
    const req = { headers: { authorization: 'Bearer t' } };
    await auth.authenticate(req, response(), jest.fn());
    expect(getJson).toHaveBeenCalledWith('http://localhost:5002', '/internal/users/u%2Fa%20b');
  });

  test('accepts Auth0 verification success', async () => {
    process.env.AUTH0_DOMAIN = 'https://tenant.example.com/'; process.env.AUTH0_AUDIENCE = 'aud';
    const { auth, jwt, getJson, jwks } = load();
    jwks.getSigningKey.mockResolvedValue({ getPublicKey: () => 'PUBLIC_KEY' });
    jwt.verify.mockImplementation((token, keyResolver, options, callback) => {
      keyResolver({ kid: 'kid1' }, (err, key) => {
        expect(err).toBeNull(); expect(key).toBe('PUBLIC_KEY');
        callback(null, { 'https://shopsphere/user_id': 'auth0-user' });
      });
    });
    getJson.mockResolvedValue({ ok: true, data: { data: { id: 'auth0-user', role: 'USER', status: 'ACTIVE' } } });
    const req = { headers: { authorization: 'Bearer a.b.c' } }; const next = jest.fn();
    await auth.authenticate(req, response(), next);
    expect(req.auth.id).toBe('auth0-user'); expect(next).toHaveBeenCalled();
  });

  test('falls back to JWT when Auth0 verification fails', async () => {
    process.env.AUTH0_DOMAIN = 'tenant.example.com'; process.env.AUTH0_AUDIENCE = 'aud';
    const { auth, jwt, getJson } = load();
    jwt.verify.mockImplementation((token, keyOrSecret, optionsOrCallback, maybeCallback) => {
      if (typeof maybeCallback === 'function') { maybeCallback(new Error('bad auth0')); return; }
      return { id: 'fallback' };
    });
    getJson.mockResolvedValue({ ok: true, data: { data: { id: 'fallback', role: 'USER', status: 'ACTIVE' } } });
    const req = { headers: { authorization: 'Bearer a.b.c' } }; const next = jest.fn();
    await auth.authenticate(req, response(), next);
    expect(req.auth.id).toBe('fallback'); expect(next).toHaveBeenCalled();
  });

  test('falls back when Auth0 token has no kid', async () => {
    process.env.AUTH0_DOMAIN = 'tenant.example.com'; process.env.AUTH0_AUDIENCE = 'aud';
    const { auth, jwt, getJson } = load(); let calls = 0;
    jwt.verify.mockImplementation((token, keyResolver, options, callback) => {
      calls += 1;
      if (calls === 1) { keyResolver({}, callback); return; }
      return { id: 'fallback2' };
    });
    getJson.mockResolvedValue({ ok: true, data: { data: { id: 'fallback2', role: 'USER', status: 'ACTIVE' } } });
    const req = { headers: { authorization: 'Bearer a.b.c' } }; const next = jest.fn();
    await auth.authenticate(req, response(), next);
    expect(req.auth.id).toBe('fallback2'); expect(next).toHaveBeenCalled();
  });

  test('falls back when JWKS lookup fails', async () => {
    process.env.AUTH0_DOMAIN = 'tenant.example.com'; process.env.AUTH0_AUDIENCE = 'aud';
    const { auth, jwt, getJson, jwks } = load(); let calls = 0;
    jwks.getSigningKey.mockRejectedValue(new Error('jwks down'));
    jwt.verify.mockImplementation((token, keyResolver, options, callback) => {
      calls += 1;
      if (calls === 1) { keyResolver({ kid: 'k' }, callback); return; }
      return { id: 'fallback3' };
    });
    getJson.mockResolvedValue({ ok: true, data: { data: { id: 'fallback3', role: 'USER', status: 'ACTIVE' } } });
    const req = { headers: { authorization: 'Bearer a.b.c' } }; const next = jest.fn();
    await auth.authenticate(req, response(), next);
    expect(req.auth.id).toBe('fallback3'); expect(next).toHaveBeenCalled();
  });

  test('rejects identity without user id', async () => {
    const { auth, jwt } = load(); jwt.verify.mockReturnValue({ sub: 'x' }); const res = response();
    await auth.authenticate({ headers: { authorization: 'Bearer t' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Token does not contain a user id.' });
  });

  test('rejects missing downstream user', async () => {
    const { auth, jwt, getJson } = load(); jwt.verify.mockReturnValue({ id: 'u' }); getJson.mockResolvedValue({ ok: false, data: null }); const res = response();
    await auth.authenticate({ headers: { authorization: 'Bearer t' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401); expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User account not found.' });
  });

  test('rejects downstream result without data.data', async () => {
    const { auth, jwt, getJson } = load(); jwt.verify.mockReturnValue({ id: 'u' }); getJson.mockResolvedValue({ ok: true, data: {} }); const res = response();
    await auth.authenticate({ headers: { authorization: 'Bearer t' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('rejects disabled account', async () => {
    const { auth, jwt, getJson } = load(); jwt.verify.mockReturnValue({ id: 'u' }); getJson.mockResolvedValue({ ok: true, data: { data: { id: 'u', status: 'DISABLED' } } }); const res = response();
    await auth.authenticate({ headers: { authorization: 'Bearer t' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403); expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Account disabled.' });
  });

  test('handles JWT verification errors', async () => {
    const { auth, jwt } = load(); jwt.verify.mockImplementation(() => { throw new Error('expired'); }); const res = response();
    await auth.authenticate({ headers: { authorization: 'Bearer t' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401); expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid or expired token.' });
  });

  test('authorize allows matching role', () => {
    const { auth } = load(); const next = jest.fn(); auth.authorize('USER')({ user: { role: 'USER' } }, response(), next); expect(next).toHaveBeenCalled();
  });

  test('authorize rejects missing user', () => {
    const { auth } = load(); const res = response(); auth.authorize('USER')({}, res, jest.fn()); expect(res.status).toHaveBeenCalledWith(403);
  });

  test('authorize rejects wrong role', () => {
    const { auth } = load(); const res = response(); auth.authorize('ADMIN')({ user: { role: 'USER' } }, res, jest.fn()); expect(res.status).toHaveBeenCalledWith(403);
  });
});
