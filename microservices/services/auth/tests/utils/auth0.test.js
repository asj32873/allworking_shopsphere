describe("auth0 utility", () => {
  const originalEnv = process.env;
  let fetchMock;

  function loadAuth0({
    domain = "example.auth0.com",
    audience = "https://api.example.com",
    jwtVerify = jest.fn(),
    signingKey = null,
  } = {}) {
    jest.resetModules();

    process.env = {
      ...originalEnv,
      AUTH0_DOMAIN: domain,
      AUTH0_AUDIENCE: audience,
    };

    const getSigningKey = jest.fn();

    if (signingKey) {
      getSigningKey.mockResolvedValue(signingKey);
    }

    jest.doMock("jsonwebtoken", () => ({
      verify: jwtVerify,
    }));

    jest.doMock("jwks-rsa", () =>
      jest.fn(() => ({
        getSigningKey,
      })),
    );

    const auth0 = require("../../src/utils/auth0");

    return {
      auth0,
      getSigningKey,
    };
  }

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();

    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete global.fetch;
  });

  describe("configuration", () => {
    test("normalizes Auth0 domain", () => {
      const jwtVerify = jest.fn((token, getKey, options, callback) => {
        callback(null, { sub: "auth0|123" });
      });

      const { auth0 } = loadAuth0({
        domain: "https://example.auth0.com/",
        audience: "my-api",
        jwtVerify,
      });

      expect(auth0.verifyAuth0Token).toBeDefined();
      expect(auth0.getAuth0UserInfo).toBeDefined();
    });

    test("warns when Auth0 domain and audience are missing", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      jest.resetModules();

      process.env = {
        ...originalEnv,
      };

      delete process.env.AUTH0_DOMAIN;
      delete process.env.AUTH0_AUDIENCE;

      jest.doMock("jsonwebtoken", () => ({
        verify: jest.fn(),
      }));

      jest.doMock("jwks-rsa", () => jest.fn());

      const auth0 = require("../../src/utils/auth0");

      expect(auth0.verifyAuth0Token).toBeDefined();
      expect(auth0.getAuth0UserInfo).toBeDefined();

      expect(warnSpy).toHaveBeenCalledWith(
        "[AUTH0] AUTH0_DOMAIN is not configured.",
      );

      expect(warnSpy).toHaveBeenCalledWith(
        "[AUTH0] AUTH0_AUDIENCE is not configured.",
      );
    });

    test("warns only for missing audience when domain exists", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      jest.resetModules();

      process.env = {
        ...originalEnv,
        AUTH0_DOMAIN: "example.auth0.com",
      };

      delete process.env.AUTH0_AUDIENCE;

      jest.doMock("jsonwebtoken", () => ({
        verify: jest.fn(),
      }));

      jest.doMock("jwks-rsa", () =>
        jest.fn(() => ({
          getSigningKey: jest.fn(),
        })),
      );

      require("../../src/utils/auth0");

      expect(warnSpy).toHaveBeenCalledWith(
        "[AUTH0] AUTH0_AUDIENCE is not configured.",
      );

      expect(warnSpy).not.toHaveBeenCalledWith(
        "[AUTH0] AUTH0_DOMAIN is not configured.",
      );
    });
  });

  describe("verifyAuth0Token", () => {
    test("resolves payload when token is valid", async () => {
      const jwtVerify = jest.fn((token, getKey, options, callback) => {
        callback(null, {
          sub: "auth0|123",
          scope: "read:users",
        });
      });

      const { auth0 } = loadAuth0({
        jwtVerify,
        audience: "my-api",
      });

      await expect(auth0.verifyAuth0Token("valid-token")).resolves.toEqual({
        sub: "auth0|123",
        scope: "read:users",
      });

      expect(jwtVerify).toHaveBeenCalledWith(
        "valid-token",
        expect.any(Function),
        {
          algorithms: ["RS256"],
          audience: "my-api",
          issuer: "https://example.auth0.com/",
        },
        expect.any(Function),
      );
    });

    test("rejects when JWT verification fails", async () => {
      const jwtVerify = jest.fn((token, getKey, options, callback) => {
        callback(new Error("Token expired"));
      });

      const { auth0 } = loadAuth0({
        jwtVerify,
      });

      await expect(auth0.verifyAuth0Token("expired-token")).rejects.toThrow(
        "Token expired",
      );
    });

    test("uses signing key callback successfully", async () => {
      const publicKey = "PUBLIC_KEY";

      const getSigningKey = jest.fn((kid) =>
        Promise.resolve({
          getPublicKey: () => publicKey,
        }),
      );

      const jwtVerify = jest.fn((token, getKey, options, callback) => {
        getKey({ kid: "key-123" }, (error, key) => {
          expect(error).toBeNull();
          expect(key).toBe(publicKey);

          callback(null, {
            sub: "auth0|123",
          });
        });
      });

      jest.resetModules();

      process.env = {
        ...originalEnv,
        AUTH0_DOMAIN: "example.auth0.com",
        AUTH0_AUDIENCE: "my-api",
      };

      jest.doMock("jsonwebtoken", () => ({
        verify: jwtVerify,
      }));

      jest.doMock("jwks-rsa", () =>
        jest.fn(() => ({
          getSigningKey,
        })),
      );

      const { verifyAuth0Token } = require("../../src/utils/auth0");

      await expect(verifyAuth0Token("token")).resolves.toEqual({
        sub: "auth0|123",
      });

      expect(getSigningKey).toHaveBeenCalledWith("key-123");
    });

    test("rejects signing key lookup errors", async () => {
      const jwtVerify = jest.fn((token, getKey, options, callback) => {
        getKey({ kid: "key-123" }, (error) => {
          callback(error);
        });
      });

      const getSigningKey = jest.fn(() =>
        Promise.reject(new Error("JWKS unavailable")),
      );

      jest.resetModules();

      process.env = {
        ...originalEnv,
        AUTH0_DOMAIN: "example.auth0.com",
        AUTH0_AUDIENCE: "my-api",
      };

      jest.doMock("jsonwebtoken", () => ({
        verify: jwtVerify,
      }));

      jest.doMock("jwks-rsa", () =>
        jest.fn(() => ({
          getSigningKey,
        })),
      );

      const { verifyAuth0Token } = require("../../src/utils/auth0");

      await expect(verifyAuth0Token("token")).rejects.toThrow(
        "JWKS unavailable",
      );
    });

    test("rejects when token has no signing key identifier", async () => {
      const jwtVerify = jest.fn((token, getKey, options, callback) => {
        getKey({}, (error) => {
          callback(error);
        });
      });

      const { auth0 } = loadAuth0({
        jwtVerify,
      });

      await expect(auth0.verifyAuth0Token("token")).rejects.toThrow(
        "Auth0 token does not contain a signing key identifier.",
      );
    });
  });

  describe("getAuth0UserInfo", () => {
    test("returns parsed user profile", async () => {
      const { auth0 } = loadAuth0();

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            sub: "auth0|123",
            email: "user@example.com",
            email_verified: true,
          }),
        ),
      });

      await expect(auth0.getAuth0UserInfo("access-token")).resolves.toEqual({
        sub: "auth0|123",
        email: "user@example.com",
        email_verified: true,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://example.auth0.com/userinfo",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer access-token",
          },
        },
      );
    });

    test("throws when issuer is not configured", async () => {
      jest.resetModules();

      process.env = {
        ...originalEnv,
      };

      delete process.env.AUTH0_DOMAIN;
      delete process.env.AUTH0_AUDIENCE;

      jest.doMock("jsonwebtoken", () => ({
        verify: jest.fn(),
      }));

      jest.doMock("jwks-rsa", () => jest.fn());

      const { getAuth0UserInfo } = require("../../src/utils/auth0");

      await expect(getAuth0UserInfo("access-token")).rejects.toThrow(
        "Auth0 issuer is not configured.",
      );
    });

    test("throws on non-OK Auth0 response", async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { auth0 } = loadAuth0();

      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            error: "invalid_token",
          }),
        ),
      });

      await expect(auth0.getAuth0UserInfo("bad-token")).rejects.toThrow(
        "Unable to retrieve Auth0 user profile.",
      );

      expect(errorSpy).toHaveBeenCalledWith("[AUTH0 USERINFO ERROR]", 401, {
        error: "invalid_token",
      });
    });

    test("throws when Auth0 returns an empty body", async () => {
      const { auth0 } = loadAuth0();

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(""),
      });

      await expect(auth0.getAuth0UserInfo("token")).rejects.toThrow(
        "Auth0 returned an empty user profile.",
      );
    });

    test("throws when Auth0 returns invalid JSON", async () => {
      const { auth0 } = loadAuth0();

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("not valid json"),
      });

      await expect(auth0.getAuth0UserInfo("token")).rejects.toThrow(
        "Auth0 returned an empty user profile.",
      );
    });

    test("handles invalid JSON from an error response", async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { auth0 } = loadAuth0();

      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue("not valid json"),
      });

      await expect(auth0.getAuth0UserInfo("token")).rejects.toThrow(
        "Unable to retrieve Auth0 user profile.",
      );

      expect(errorSpy).toHaveBeenCalledWith(
        "[AUTH0 USERINFO ERROR]",
        500,
        "not valid json",
      );
    });
  });
});
