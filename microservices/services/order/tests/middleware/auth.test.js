describe("order auth middleware", () => {
  let authenticate;
  let authorize;
  let jwt;
  let getJson;
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.resetModules();

    process.env.AUTH0_DOMAIN = "";
    process.env.AUTH0_AUDIENCE = "";
    process.env.JWT_SECRET = "test-secret";

    jest.doMock("jsonwebtoken", () => ({
      verify: jest.fn(),
    }));

    jest.doMock("jwks-rsa", () => {
      return jest.fn(() => ({
        getSigningKey: jest.fn(),
      }));
    });

    jest.doMock("../../src/utils/serviceClient", () => ({
      getJson: jest.fn(),
    }));

    jwt = require("jsonwebtoken");
    getJson = require("../../src/utils/serviceClient").getJson;

    const auth = require("../../src/middleware/auth");

    authenticate = auth.authenticate;
    authorize = auth.authorize;

    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  test("rejects request without Bearer token", async () => {
    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication required.",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("authenticates using JWT fallback", async () => {
    req.headers.authorization = "Bearer jwt-token";

    jwt.verify.mockReturnValue({
      id: "user-123",
    });

    getJson.mockResolvedValue({
      ok: true,
      data: {
        data: {
          id: "user-123",
          role: "USER",
          status: "ACTIVE",
        },
      },
    });

    await authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "jwt-token",
      "test-secret",
    );

    expect(getJson).toHaveBeenCalledWith(
      "http://localhost:5002",
      "/internal/users/user-123",
    );

    expect(req.user).toEqual({
      id: "user-123",
      role: "USER",
      status: "ACTIVE",
    });

    expect(req.auth).toEqual({
      id: "user-123",
    });

    expect(next).toHaveBeenCalled();
  });

  test("supports namespaced user id claim", async () => {
    req.headers.authorization = "Bearer jwt-token";

    jwt.verify.mockReturnValue({
      "https://shopsphere/user_id": "user-456",
    });

    getJson.mockResolvedValue({
      ok: true,
      data: {
        data: {
          id: "user-456",
          role: "USER",
          status: "ACTIVE",
        },
      },
    });

    await authenticate(req, res, next);

    expect(getJson).toHaveBeenCalledWith(
      "http://localhost:5002",
      "/internal/users/user-456",
    );

    expect(next).toHaveBeenCalled();
  });

  test("rejects token without user id", async () => {
    req.headers.authorization = "Bearer jwt-token";

    jwt.verify.mockReturnValue({
      email: "test@example.com",
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token does not contain a user id.",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("rejects when auth service cannot find user", async () => {
    req.headers.authorization = "Bearer jwt-token";

    jwt.verify.mockReturnValue({
      id: "missing-user",
    });

    getJson.mockResolvedValue({
      ok: false,
      data: null,
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User account not found.",
    });
  });

  test("rejects disabled account", async () => {
    req.headers.authorization = "Bearer jwt-token";

    jwt.verify.mockReturnValue({
      id: "disabled-user",
    });

    getJson.mockResolvedValue({
      ok: true,
      data: {
        data: {
          id: "disabled-user",
          role: "USER",
          status: "DISABLED",
        },
      },
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Account disabled.",
    });
  });

  test("returns 401 when JWT verification fails", async () => {
    req.headers.authorization = "Bearer jwt-token";

    jwt.verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid or expired token.",
    });
  });

  describe("authorize", () => {
    test("allows matching role", () => {
      req.user = {
        role: "ADMIN",
      };

      authorize("ADMIN")(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("rejects missing user", () => {
      req.user = undefined;

      authorize("ADMIN")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          "You do not have permission for this resource.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("rejects wrong role", () => {
      req.user = {
        role: "USER",
      };

      authorize("ADMIN")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);

      expect(next).not.toHaveBeenCalled();
    });
  });
});