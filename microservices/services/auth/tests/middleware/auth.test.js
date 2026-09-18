const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
}));

const { getJson } = require("../../src/utils/serviceClient");
const { authenticate, authorize } = require("../../src/middleware/auth");

describe("auth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_SECRET = "test-secret";
    process.env.AUTH_SERVICE_URL = "http://localhost:5002";
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
        headers: { authorization: "Basic abc123" },
      };
      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when JWT is invalid", async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error("invalid token");
      });

      const req = {
        headers: { authorization: "Bearer invalid-token" },
      };
      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        "invalid-token",
        "test-secret",
        { algorithms: ["HS256"] },
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid or expired token.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when token has no user id", async () => {
      jwt.verify.mockReturnValue({
        role: "USER",
      });

      const req = {
        headers: { authorization: "Bearer token-without-id" },
      };
      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid token.",
      });
      expect(getJson).not.toHaveBeenCalled();
    });

    test("loads the current user from Auth Service", async () => {
      jwt.verify.mockReturnValue({
        id: "user-123",
        role: "USER",
        type: "shopsphere",
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
        headers: { authorization: "Bearer valid-token" },
      };
      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

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
        type: "shopsphere",
      });

      expect(next).toHaveBeenCalledTimes(1);
    });

    test("returns 401 when Auth Service cannot find the user", async () => {
      jwt.verify.mockReturnValue({
        id: "missing-user",
        role: "USER",
      });

      getJson.mockResolvedValue({
        ok: false,
        data: null,
      });

      const req = {
        headers: { authorization: "Bearer valid-token" },
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

    test("returns 403 when the user is disabled", async () => {
      jwt.verify.mockReturnValue({
        id: "disabled-user",
        role: "USER",
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            _id: "disabled-user",
            role: "USER",
            status: "DISABLED",
          },
        },
      });

      const req = {
        headers: { authorization: "Bearer disabled-token" },
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
  });

  describe("authorize", () => {
    test("returns 403 when req.user is missing", () => {
      const middleware = authorize("USER");
      const req = {};
      const res = createResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 when role is not allowed", () => {
      const middleware = authorize("USER");
      const req = { user: { role: "ADMIN" } };
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

    test("calls next when role is allowed", () => {
      const middleware = authorize("USER");
      const req = { user: { role: "USER" } };
      const res = createResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test("supports multiple allowed roles", () => {
      const middleware = authorize("ADMIN", "USER");
      const req = { user: { role: "ADMIN" } };
      const res = createResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
