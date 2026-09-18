jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

jest.mock("jwks-rsa", () =>
  jest.fn(() => ({
    getSigningKey: jest.fn(),
  }))
);

describe("vendor auth middleware", () => {
  const res = () => {
    const r = {
      status: jest.fn(),
      json: jest.fn(),
    };
    r.status.mockReturnValue(r);
    return r;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    delete process.env.AUTH0_DOMAIN;
    delete process.env.AUTH0_AUDIENCE;
    delete process.env.AUTH_SERVICE_URL;

    process.env.JWT_SECRET = "secret";
  });

  function load() {
    const jwt = require("jsonwebtoken");
    const serviceClient = require("../../src/utils/serviceClient");
    const auth = require("../../src/middleware/auth");

    return {
      ...auth,
      jwt,
      getJson: serviceClient.getJson,
    };
  }

  test("requires Bearer authentication", async () => {
    const { authenticate } = load();

    const r = res();
    const next = jest.fn();

    await authenticate({ headers: {} }, r, next);

    expect(r.status).toHaveBeenCalledWith(401);
    expect(r.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication required.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects malformed authorization header", async () => {
    const { authenticate } = load();

    const r = res();
    const next = jest.fn();

    await authenticate(
      { headers: { authorization: "Basic abc" } },
      r,
      next
    );

    expect(r.status).toHaveBeenCalledWith(401);
    expect(r.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication required.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("accepts JWT identity id and loads active user", async () => {
    const { authenticate, jwt, getJson } = load();

    jwt.verify.mockReturnValue({
      id: "u1",
      role: "VENDOR",
    });

    getJson.mockResolvedValue({
      ok: true,
      data: {
        data: {
          id: "u1",
          role: "VENDOR",
          status: "ACTIVE",
        },
      },
    });

    const req = {
      headers: {
        authorization: "Bearer abc",
      },
    };

    const r = res();
    const next = jest.fn();

    await authenticate(req, r, next);

    expect(jwt.verify).toHaveBeenCalledWith("abc", "secret");

    expect(getJson).toHaveBeenCalledWith(
      "http://localhost:5002",
      "/internal/users/u1"
    );

    expect(req.user).toEqual({
      id: "u1",
      role: "VENDOR",
      status: "ACTIVE",
    });

    expect(req.auth).toEqual({
      id: "u1",
      role: "VENDOR",
    });

    expect(next).toHaveBeenCalled();
  });

  test("uses configured auth service and encodes user id", async () => {
    process.env.AUTH_SERVICE_URL = "http://auth";

    const { authenticate, jwt, getJson } = load();

    jwt.verify.mockReturnValue({
      id: "a/b c",
    });

    getJson.mockResolvedValue({
      ok: true,
      data: {
        data: {
          status: "ACTIVE",
        },
      },
    });

    const req = {
      headers: {
        authorization: "Bearer token",
      },
    };

    const r = res();
    const next = jest.fn();

    await authenticate(req, r, next);

    expect(getJson).toHaveBeenCalledWith(
      "http://auth",
      "/internal/users/a%2Fb%20c"
    );

    expect(req.auth.id).toBe("a/b c");
    expect(next).toHaveBeenCalled();
  });

  test("supports Auth0 user id claim when JWT fallback is used", async () => {
    const { authenticate, jwt, getJson } = load();

    jwt.verify.mockReturnValue({
      "https://shopsphere/user_id": "u2",
      role: "VENDOR",
    });

    getJson.mockResolvedValue({
      ok: true,
      data: {
        data: {
          status: "ACTIVE",
        },
      },
    });

    const req = {
      headers: {
        authorization: "Bearer token",
      },
    };

    const r = res();
    const next = jest.fn();

    await authenticate(req, r, next);

    expect(req.auth).toEqual({
      "https://shopsphere/user_id": "u2",
      role: "VENDOR",
      id: "u2",
    });

    expect(next).toHaveBeenCalled();
  });

  test("rejects identity without user id", async () => {
    const { authenticate, jwt, getJson } = load();

    jwt.verify.mockReturnValue({
      role: "VENDOR",
    });

    const r = res();

    await authenticate(
      {
        headers: {
          authorization: "Bearer token",
        },
      },
      r,
      jest.fn()
    );

    expect(r.status).toHaveBeenCalledWith(401);

    expect(r.json).toHaveBeenCalledWith({
      success: false,
      message: "Token does not contain a user id.",
    });

    expect(getJson).not.toHaveBeenCalled();
  });

  test("rejects missing downstream user", async () => {
    const { authenticate, jwt, getJson } = load();

    jwt.verify.mockReturnValue({
      id: "u1",
    });

    getJson.mockResolvedValue({
      ok: false,
      data: null,
    });

    const r = res();

    await authenticate(
      {
        headers: {
          authorization: "Bearer token",
        },
      },
      r,
      jest.fn()
    );

    expect(r.status).toHaveBeenCalledWith(401);

    expect(r.json).toHaveBeenCalledWith({
      success: false,
      message: "User account not found.",
    });
  });

  test("rejects disabled account", async () => {
    const { authenticate, jwt, getJson } = load();

    jwt.verify.mockReturnValue({
      id: "u1",
    });

    getJson.mockResolvedValue({
      ok: true,
      data: {
        data: {
          status: "DISABLED",
        },
      },
    });

    const r = res();

    await authenticate(
      {
        headers: {
          authorization: "Bearer token",
        },
      },
      r,
      jest.fn()
    );

    expect(r.status).toHaveBeenCalledWith(403);

    expect(r.json).toHaveBeenCalledWith({
      success: false,
      message: "Account disabled.",
    });
  });

  test("catches invalid JWT", async () => {
    const { authenticate, jwt } = load();

    jwt.verify.mockImplementation(() => {
      throw new Error("bad token");
    });

    const spy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const r = res();

    await authenticate(
      {
        headers: {
          authorization: "Bearer bad",
        },
      },
      r,
      jest.fn()
    );

    expect(r.status).toHaveBeenCalledWith(401);

    expect(r.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid or expired token.",
    });

    spy.mockRestore();
  });

  test("authorize allows a permitted role", () => {
    const { authorize } = load();

    const next = jest.fn();

    authorize("VENDOR", "ADMIN")(
      {
        user: {
          role: "VENDOR",
        },
      },
      res(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  test("authorize rejects missing user", () => {
    const { authorize } = load();

    const r = res();
    const next = jest.fn();

    authorize("VENDOR")({}, r, next);

    expect(r.status).toHaveBeenCalledWith(403);

    expect(r.json).toHaveBeenCalledWith({
      success: false,
      message: "You do not have permission for this resource.",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("authorize rejects wrong role", () => {
    const { authorize } = load();

    const r = res();
    const next = jest.fn();

    authorize("VENDOR")(
      {
        user: {
          role: "USER",
        },
      },
      r,
      next
    );

    expect(r.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

    test("falls back to JWT when Auth0 verification fails", async () => {
    process.env.AUTH0_DOMAIN = "tenant.example.com";
    process.env.AUTH0_AUDIENCE = "aud";

    const { authenticate, jwt, getJson } = load();

    getJson.mockResolvedValue({
      ok: true,
      data: {
        data: {
          status: "ACTIVE",
        },
      },
    });

    jwt.verify.mockImplementation((token, keyOrSecret, optionsOrCallback, callback) => {
      // Auth0 verification uses the callback-based form.
      if (typeof optionsOrCallback === "object") {
        const cb = typeof callback === "function" ? callback : optionsOrCallback;
        cb(new Error("auth0 bad"));
        return;
      }

      // JWT fallback uses the synchronous form.
      return {
        id: "u3",
        role: "VENDOR",
      };
    });

    const req = {
      headers: {
        authorization: "Bearer a.b.c",
      },
    };

    const r = res();
    const next = jest.fn();

    await authenticate(req, r, next);

    expect(req.auth.id).toBe("u3");
    expect(next).toHaveBeenCalled();
  });
});
