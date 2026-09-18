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

describe("address auth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_SECRET = "test-secret";
    process.env.AUTH_SERVICE_URL = "http://localhost:5002";

    delete process.env.AUTH0_DOMAIN;
    delete process.env.AUTH0_AUDIENCE;
  });

  function createResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  describe("authenticate", () => {
    test("returns 401 when Authorization header is missing", async () => {
      const req = { headers: {} };
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

    test("accepts a normal JWT with id", async () => {
      jwt.verify.mockReturnValue({
        id: "user-123",
        role: "USER",
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            _id: "user-123",
            role: "USER",
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
        "/internal/users/user-123",
      );

      expect(req.user).toEqual({
        _id: "user-123",
        role: "USER",
        status: "ACTIVE",
      });

      expect(req.auth).toEqual({
        id: "user-123",
        role: "USER",
      });

      expect(next).toHaveBeenCalledTimes(1);
    });

    test("uses Auth0 namespaced user id when id is absent", async () => {
      jwt.verify.mockReturnValue({
        "https://shopsphere/user_id": "auth0-user-123",
        role: "USER",
      });

      getJson.mockResolvedValue({
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
          authorization: "Bearer normal-token",
        },
      };
      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(getJson).toHaveBeenCalledWith(
        "http://localhost:5002",
        "/internal/users/auth0-user-123",
      );

      expect(req.auth.id).toBe("auth0-user-123");
      expect(next).toHaveBeenCalled();
    });

    test("encodes special characters in user id", async () => {
      const userId = "user@example.com/test";

      jwt.verify.mockReturnValue({
        id: userId,
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            id: userId,
            role: "USER",
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

    test("returns 401 when JWT has no user id", async () => {
      jwt.verify.mockReturnValue({
        role: "USER",
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

    test("returns 401 when user service returns ok=false", async () => {
      jwt.verify.mockReturnValue({
        id: "user-123",
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

    test("returns 401 when user service has no data", async () => {
      jwt.verify.mockReturnValue({
        id: "user-123",
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
        id: "user-123",
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            id: "user-123",
            role: "USER",
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

    test("returns 401 when JWT verification throws", async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error("invalid token");
      });

      const req = {
        headers: {
          authorization: "Bearer bad-token",
        },
      };
      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith("bad-token", "test-secret");

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid or expired token.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when downstream user lookup throws", async () => {
      jwt.verify.mockReturnValue({
        id: "user-123",
      });

      getJson.mockRejectedValue(new Error("auth service unavailable"));

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
        message: "Invalid or expired token.",
      });

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("authorize", () => {
    test("returns 403 when req.user is missing", () => {
      const middleware = authorize("USER");

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

    test("returns 403 when role is not allowed", () => {
      const middleware = authorize("USER");

      const req = {
        user: {
          role: "ADMIN",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test("calls next when role is allowed", () => {
      const middleware = authorize("USER");

      const req = {
        user: {
          role: "USER",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test("supports multiple allowed roles", () => {
      const middleware = authorize("ADMIN", "USER");

      const req = {
        user: {
          role: "ADMIN",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
