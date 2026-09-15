const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
}));

jest.mock("jwks-rsa", () =>
  jest.fn(() => ({
    getSigningKey: jest.fn(),
  })),
);

const { getJson } = require("../../src/utils/serviceClient");

const { authenticate, authorize } = require("../../src/middleware/auth");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("admin auth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_SECRET = "test-secret";
    process.env.AUTH_SERVICE_URL = "http://localhost:5002";

    delete process.env.AUTH0_DOMAIN;
    delete process.env.AUTH0_AUDIENCE;
  });

  describe("authenticate", () => {
    test("returns 401 when Authorization header is missing", async () => {
      const req = {
        headers: {},
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Authentication required.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 for non-Bearer authorization", async () => {
      const req = {
        headers: {
          authorization: "Basic abc123",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test("authenticates valid JWT", async () => {
      jwt.verify.mockReturnValue({
        id: "admin-123",
        role: "ADMIN",
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            _id: "admin-123",
            role: "ADMIN",
            status: "ACTIVE",
          },
        },
      });

      const req = {
        headers: {
          authorization: "Bearer valid-token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");

      expect(getJson).toHaveBeenCalledWith(
        "http://localhost:5002",
        "/internal/users/admin-123",
      );

      expect(req.user).toEqual({
        _id: "admin-123",
        role: "ADMIN",
        status: "ACTIVE",
      });

      expect(req.auth).toEqual({
        id: "admin-123",
        role: "ADMIN",
      });

      expect(next).toHaveBeenCalledTimes(1);
    });

    test("uses Auth0 namespaced user id", async () => {
      jwt.verify.mockReturnValue({
        "https://shopsphere/user_id": "auth0-admin-123",
        role: "ADMIN",
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            _id: "auth0-admin-123",
            role: "ADMIN",
            status: "ACTIVE",
          },
        },
      });

      const req = {
        headers: {
          authorization: "Bearer valid-token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(getJson).toHaveBeenCalledWith(
        "http://localhost:5002",
        "/internal/users/auth0-admin-123",
      );

      expect(req.auth.id).toBe("auth0-admin-123");
      expect(next).toHaveBeenCalled();
    });

    test("encodes user id before calling auth service", async () => {
      const userId = "admin@example.com/test";

      jwt.verify.mockReturnValue({
        id: userId,
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            id: userId,
            role: "ADMIN",
            status: "ACTIVE",
          },
        },
      });

      const req = {
        headers: {
          authorization: "Bearer valid-token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(getJson).toHaveBeenCalledWith(
        "http://localhost:5002",
        `/internal/users/${encodeURIComponent(userId)}`,
      );

      expect(next).toHaveBeenCalled();
    });

    test("returns 401 when token does not contain user id", async () => {
      jwt.verify.mockReturnValue({
        role: "ADMIN",
      });

      const req = {
        headers: {
          authorization: "Bearer valid-token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token does not contain a user id.",
      });

      expect(getJson).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when auth service rejects user", async () => {
      jwt.verify.mockReturnValue({
        id: "admin-123",
      });

      getJson.mockResolvedValue({
        ok: false,
        data: null,
      });

      const req = {
        headers: {
          authorization: "Bearer valid-token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User account not found.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when auth service has no user data", async () => {
      jwt.verify.mockReturnValue({
        id: "admin-123",
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {},
      });

      const req = {
        headers: {
          authorization: "Bearer valid-token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 when account is disabled", async () => {
      jwt.verify.mockReturnValue({
        id: "admin-123",
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            id: "admin-123",
            role: "ADMIN",
            status: "DISABLED",
          },
        },
      });

      const req = {
        headers: {
          authorization: "Bearer valid-token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Account disabled.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when JWT verification fails", async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error("invalid token");
      });

      const req = {
        headers: {
          authorization: "Bearer invalid-token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid or expired token.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when auth service lookup throws", async () => {
      jwt.verify.mockReturnValue({
        id: "admin-123",
      });

      getJson.mockRejectedValue(new Error("Auth service unavailable"));

      const req = {
        headers: {
          authorization: "Bearer valid-token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("authorize", () => {
    test("returns 403 when user is missing", () => {
      const middleware = authorize("ADMIN");

      const req = {};
      const res = createResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You do not have permission for this resource.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 for USER role", () => {
      const middleware = authorize("ADMIN");

      const req = {
        user: {
          role: "USER",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test("allows ADMIN role", () => {
      const middleware = authorize("ADMIN");

      const req = {
        user: {
          role: "ADMIN",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test("supports multiple roles", () => {
      const middleware = authorize("ADMIN", "SUPER_ADMIN");

      const req = {
        user: {
          role: "SUPER_ADMIN",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
