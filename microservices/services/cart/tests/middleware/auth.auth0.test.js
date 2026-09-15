const jwt = require("jsonwebtoken");

// auth.js reads these values when the module is loaded.
process.env.AUTH0_DOMAIN = "example.auth0.com";
process.env.AUTH0_AUDIENCE = "https://api.example.com";
process.env.JWT_SECRET = "test-secret";
process.env.AUTH_SERVICE_URL = "http://localhost:5002";

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

const mockGetSigningKey = jest.fn();

jest.mock("jwks-rsa", () =>
  jest.fn(() => ({
    getSigningKey: mockGetSigningKey,
  })),
);

jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
}));

const { getJson } = require("../../src/utils/serviceClient");
const { authenticate } = require("../../src/middleware/auth");

describe("Auth0 authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Keep the environment values available for every test.
    process.env.AUTH0_DOMAIN = "example.auth0.com";
    process.env.AUTH0_AUDIENCE = "https://api.example.com";
    process.env.JWT_SECRET = "test-secret";
    process.env.AUTH_SERVICE_URL = "http://localhost:5002";
  });

  afterAll(() => {
    delete process.env.AUTH0_DOMAIN;
    delete process.env.AUTH0_AUDIENCE;
    delete process.env.JWT_SECRET;
    delete process.env.AUTH_SERVICE_URL;
  });

  function createResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  test("authenticates a valid Auth0 token", async () => {
    const publicKey = "-----BEGIN PUBLIC KEY-----test-----END PUBLIC KEY-----";

    mockGetSigningKey.mockResolvedValueOnce({
      getPublicKey: jest.fn().mockReturnValue(publicKey),
    });

    jwt.verify.mockImplementationOnce(
      (token, keyCallback, options, callback) => {
        expect(token).toBe("header.payload.signature");

        expect(options).toEqual({
          algorithms: ["RS256"],
          audience: "https://api.example.com",
          issuer: "https://example.auth0.com/",
        });

        // auth.js passes signingKey as the second argument.
        expect(typeof keyCallback).toBe("function");

        keyCallback({ kid: "test-kid" }, (error, key) => {
          expect(error).toBeNull();
          expect(key).toBe(publicKey);

          callback(null, {
            sub: "auth0|123",
            "https://shopsphere/user_id": "auth0-user-123",
            role: "USER",
          });
        });
      },
    );

    getJson.mockResolvedValueOnce({
      ok: true,
      data: {
        data: {
          _id: "auth0-user-123",
          role: "USER",
          status: "ACTIVE",
        },
      },
    });

    const req = {
      headers: {
        authorization: "Bearer header.payload.signature",
      },
    };

    const res = createResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(mockGetSigningKey).toHaveBeenCalledWith("test-kid");

    expect(getJson).toHaveBeenCalledWith(
      "http://localhost:5002",
      "/internal/users/auth0-user-123",
    );

    expect(req.user).toEqual({
      _id: "auth0-user-123",
      role: "USER",
      status: "ACTIVE",
    });

    expect(req.auth).toEqual({
      sub: "auth0|123",
      "https://shopsphere/user_id": "auth0-user-123",
      role: "USER",
      id: "auth0-user-123",
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("falls back to JWT when Auth0 verification fails", async () => {
    jwt.verify
      .mockImplementationOnce((token, keyCallback, options, callback) => {
        expect(token).toBe("header.payload.signature");
        callback(new Error("Auth0 verification failed"));
      })
      .mockReturnValueOnce({
        id: "fallback-user",
        role: "USER",
      });

    getJson.mockResolvedValueOnce({
      ok: true,
      data: {
        data: {
          _id: "fallback-user",
          role: "USER",
          status: "ACTIVE",
        },
      },
    });

    const req = {
      headers: {
        authorization: "Bearer header.payload.signature",
      },
    };

    const res = createResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalledTimes(2);

    expect(jwt.verify).toHaveBeenLastCalledWith(
      "header.payload.signature",
      "test-secret",
    );

    expect(getJson).toHaveBeenCalledWith(
      "http://localhost:5002",
      "/internal/users/fallback-user",
    );

    expect(req.auth).toEqual({
      id: "fallback-user",
      role: "USER",
    });

    expect(req.user).toEqual({
      _id: "fallback-user",
      role: "USER",
      status: "ACTIVE",
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("uses normal JWT directly when token is not a JWT", async () => {
    jwt.verify.mockReturnValueOnce({
      id: "normal-user",
      role: "USER",
    });

    getJson.mockResolvedValueOnce({
      ok: true,
      data: {
        data: {
          _id: "normal-user",
          role: "USER",
          status: "ACTIVE",
        },
      },
    });

    const req = {
      headers: {
        authorization: "Bearer simple-token",
      },
    };

    const res = createResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    // simple-token does not have 3 JWT segments,
    // so Auth0 verification is skipped.
    expect(jwt.verify).toHaveBeenCalledTimes(1);

    expect(jwt.verify).toHaveBeenCalledWith("simple-token", "test-secret");

    expect(getJson).toHaveBeenCalledWith(
      "http://localhost:5002",
      "/internal/users/normal-user",
    );

    expect(req.auth).toEqual({
      id: "normal-user",
      role: "USER",
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("returns 401 when Auth0 token has no user id", async () => {
    jwt.verify.mockImplementationOnce(
      (token, keyCallback, options, callback) => {
        callback(null, {
          sub: "auth0|123",
          role: "USER",
        });
      },
    );

    const req = {
      headers: {
        authorization: "Bearer header.payload.signature",
      },
    };

    const res = createResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    // Auth0 verification succeeded, so JWT fallback is NOT attempted.
    expect(jwt.verify).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token does not contain a user id.",
    });

    expect(getJson).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("falls back to JWT when JWKS signing-key lookup fails", async () => {
    mockGetSigningKey.mockImplementationOnce(() =>
      Promise.reject(new Error("JWKS unavailable")),
    );

    jwt.verify
      .mockImplementationOnce((token, keyCallback, options, callback) => {
        expect(token).toBe("header.payload.signature");

        keyCallback({ kid: "bad-kid" }, (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe("JWKS unavailable");

          callback(error);
        });
      })
      .mockReturnValueOnce({
        id: "fallback-user",
        role: "USER",
      });

    getJson.mockResolvedValueOnce({
      ok: true,
      data: {
        data: {
          _id: "fallback-user",
          role: "USER",
          status: "ACTIVE",
        },
      },
    });

    const req = {
      headers: {
        authorization: "Bearer header.payload.signature",
      },
    };

    const res = createResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(mockGetSigningKey).toHaveBeenCalledTimes(1);
    expect(mockGetSigningKey).toHaveBeenCalledWith("bad-kid");

    expect(jwt.verify).toHaveBeenCalledTimes(2);

    expect(jwt.verify).toHaveBeenLastCalledWith(
      "header.payload.signature",
      "test-secret",
    );

    expect(getJson).toHaveBeenCalledWith(
      "http://localhost:5002",
      "/internal/users/fallback-user",
    );

    expect(req.user).toEqual({
      _id: "fallback-user",
      role: "USER",
      status: "ACTIVE",
    });

    expect(req.auth).toEqual({
      id: "fallback-user",
      role: "USER",
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("falls back to JWT when Auth0 token is missing kid", async () => {
    jwt.verify
      .mockImplementationOnce((token, keyCallback, options, callback) => {
        expect(token).toBe("header.payload.signature");

        // No kid in the Auth0 JWT header.
        keyCallback({}, (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe("Token is missing kid.");

          callback(error);
        });
      })
      .mockReturnValueOnce({
        id: "fallback-user",
        role: "USER",
      });

    getJson.mockResolvedValueOnce({
      ok: true,
      data: {
        data: {
          _id: "fallback-user",
          role: "USER",
          status: "ACTIVE",
        },
      },
    });

    const req = {
      headers: {
        authorization: "Bearer header.payload.signature",
      },
    };

    const res = createResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    // signingKey exits before calling jwks.getSigningKey().
    expect(mockGetSigningKey).not.toHaveBeenCalled();

    expect(jwt.verify).toHaveBeenCalledTimes(2);

    expect(jwt.verify).toHaveBeenLastCalledWith(
      "header.payload.signature",
      "test-secret",
    );

    expect(req.user).toEqual({
      _id: "fallback-user",
      role: "USER",
      status: "ACTIVE",
    });

    expect(req.auth).toEqual({
      id: "fallback-user",
      role: "USER",
    });

    expect(next).toHaveBeenCalledTimes(1);
  });
});
