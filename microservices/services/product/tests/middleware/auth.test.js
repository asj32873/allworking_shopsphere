const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

jest.mock("jwks-rsa", () =>
  jest.fn(() => ({
    getSigningKey: jest.fn(),
  }))
);

const mockGetJson = jest.fn();

jest.mock("../../src/utils/serviceClient", () => ({
  getJson: mockGetJson,
}));

const {
  authenticate,
  authorize,
} = require("../../src/middleware/auth");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("product auth middleware", () => {
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

    test("returns 401 for invalid Authorization scheme", async () => {
      const req = {
        headers: {
          authorization: "Basic abc",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when token has no user id", async () => {
      jwt.verify.mockReturnValue({
        role: "VENDOR",
      });

      const req = {
        headers: {
          authorization: "Bearer token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        "token",
        "test-secret"
      );

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token does not contain a user id.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when user account does not exist", async () => {
      jwt.verify.mockReturnValue({
        id: "user-1",
      });

      mockGetJson.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const req = {
        headers: {
          authorization: "Bearer token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(mockGetJson).toHaveBeenCalledWith(
        "http://localhost:5002",
        "/internal/users/user-1"
      );

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User account not found.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("authenticates valid user", async () => {
      const user = {
        _id: "user-1",
        id: "user-1",
        role: "VENDOR",
        email: "vendor@example.com",
      };

      jwt.verify.mockReturnValue({
        id: "user-1",
        role: "VENDOR",
      });

      mockGetJson.mockResolvedValue({
        ok: true,
        data: {
          data: user,
        },
      });

      const req = {
        headers: {
          authorization: "Bearer token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(req.user).toEqual(user);

      expect(req.auth).toEqual(
        expect.objectContaining({
          id: "user-1",
        })
      );

      expect(next).toHaveBeenCalled();
    });

    test("supports user id from Shopsphere claim", async () => {
      jwt.verify.mockReturnValue({
        "https://shopsphere/user_id": "user-123",
      });

      mockGetJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            _id: "user-123",
            role: "VENDOR",
          },
        },
      });

      const req = {
        headers: {
          authorization: "Bearer token",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(mockGetJson).toHaveBeenCalledWith(
        "http://localhost:5002",
        "/internal/users/user-123"
      );

      expect(next).toHaveBeenCalled();
    });

    test("returns 401 when JWT verification throws", async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const req = {
        headers: {
          authorization: "Bearer invalid",
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
    test("allows matching role", () => {
      const req = {
        user: {
          role: "VENDOR",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      authorize("VENDOR")(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("allows any matching role", () => {
      const req = {
        user: {
          role: "ADMIN",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      authorize("VENDOR", "ADMIN")(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("rejects missing user", () => {
      const req = {};

      const res = createResponse();
      const next = jest.fn();

      authorize("VENDOR")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You do not have permission for this resource.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("rejects incorrect role", () => {
      const req = {
        user: {
          role: "USER",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      authorize("VENDOR")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You do not have permission for this resource.",
      });

      expect(next).not.toHaveBeenCalled();
    });
  });
});