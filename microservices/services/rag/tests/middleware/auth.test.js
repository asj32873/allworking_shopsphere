const originalEnv = process.env;

describe("RAG Auth Middleware", () => {
  let authenticate;
  let authorize;
  let getJsonMock;
  let jwtVerifyMock;

  const createReq = (authorization) => ({
    headers: authorization
      ? { authorization }
      : {},
  });

  const createRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    jest.resetModules();

    process.env = {
      ...originalEnv,
      JWT_SECRET: "test-secret",
    };

    jest.mock("jsonwebtoken", () => ({
      verify: jest.fn(),
    }));

    jest.mock("../../src/utils/serviceClient", () => ({
      getJson: jest.fn(),
    }));

    const jwt = require("jsonwebtoken");
    const serviceClient = require("../../src/utils/serviceClient");

    jwtVerifyMock = jwt.verify;
    getJsonMock = serviceClient.getJson;

    ({ authenticate, authorize } = require("../../src/middleware/auth"));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("authenticate", () => {
    test("returns 401 when Authorization header is missing", async () => {
      const req = createReq();
      const res = createRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Authentication required.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when Authorization header is not Bearer", async () => {
      const req = createReq("Basic abc123");
      const res = createRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Authentication required.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("authenticates a valid JWT user", async () => {
      jwtVerifyMock.mockReturnValue({
        id: "user123",
        role: "USER",
      });

      getJsonMock.mockResolvedValue({
        ok: true,
        data: {
          data: {
            _id: "user123",
            role: "USER",
            status: "ACTIVE",
          },
        },
      });

      const req = createReq("Bearer valid-token");
      const res = createRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(jwtVerifyMock).toHaveBeenCalledWith(
        "valid-token",
        "test-secret"
      );

      expect(getJsonMock).toHaveBeenCalledWith(
        "http://localhost:5002",
        "/internal/users/user123"
      );

      expect(req.user).toEqual({
        _id: "user123",
        role: "USER",
        status: "ACTIVE",
      });

      expect(req.auth).toEqual({
        id: "user123",
        role: "USER",
      });

      expect(next).toHaveBeenCalledTimes(1);
    });

    test("uses configured AUTH_SERVICE_URL", async () => {
      process.env.AUTH_SERVICE_URL = "http://auth-service:5002";

      jest.resetModules();

      jest.mock("jsonwebtoken", () => ({
        verify: jest.fn().mockReturnValue({
          id: "user123",
        }),
      }));

      jest.mock("../../src/utils/serviceClient", () => ({
        getJson: jest.fn().mockResolvedValue({
          ok: true,
          data: {
            data: {
              id: "user123",
              role: "USER",
              status: "ACTIVE",
            },
          },
        }),
      }));

      const jwt = require("jsonwebtoken");
      const serviceClient = require("../../src/utils/serviceClient");

      ({ authenticate } = require("../../src/middleware/auth"));

      const req = createReq("Bearer valid-token");
      const res = createRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(serviceClient.getJson).toHaveBeenCalledWith(
        "http://auth-service:5002",
        "/internal/users/user123"
      );

      expect(next).toHaveBeenCalled();
    });

    test("returns 401 when token does not contain a user id", async () => {
      jwtVerifyMock.mockReturnValue({
        sub: "auth0-user",
      });

      const req = createReq("Bearer valid-token");
      const res = createRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token does not contain a user id.",
      });

      expect(getJsonMock).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test("supports ShopSphere user id from Auth0 namespace claim", async () => {
      jwtVerifyMock.mockReturnValue({
        "https://shopsphere/user_id": "auth-user-123",
      });

      getJsonMock.mockResolvedValue({
        ok: true,
        data: {
          data: {
            id: "auth-user-123",
            role: "USER",
            status: "ACTIVE",
          },
        },
      });

      const req = createReq("Bearer valid-token");
      const res = createRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(getJsonMock).toHaveBeenCalledWith(
        "http://localhost:5002",
        "/internal/users/auth-user-123"
      );

      expect(req.auth.id).toBe("auth-user-123");
      expect(next).toHaveBeenCalled();
    });

    test("URL-encodes the user id when calling auth service", async () => {
      jwtVerifyMock.mockReturnValue({
        id: "user@example.com/test",
      });

      getJsonMock.mockResolvedValue({
        ok: true,
        data: {
          data: {
            id: "user@example.com/test",
            role: "USER",
            status: "ACTIVE",
          },
        },
      });

      const req = createReq("Bearer valid-token");
      const res = createRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(getJsonMock).toHaveBeenCalledWith(
        "http://localhost:5002",
        "/internal/users/user%40example.com%2Ftest"
      );

      expect(next).toHaveBeenCalled();
    });

    test("returns 401 when auth service does not find the user", async () => {
      jwtVerifyMock.mockReturnValue({
        id: "missing-user",
      });

      getJsonMock.mockResolvedValue({
        ok: false,
        data: null,
      });

      const req = createReq("Bearer valid-token");
      const res = createRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User account not found.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when auth service response has no user data", async () => {
      jwtVerifyMock.mockReturnValue({
        id: "user123",
      });

      getJsonMock.mockResolvedValue({
        ok: true,
        data: {},
      });

      const req = createReq("Bearer valid-token");
      const res = createRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User account not found.",
      });
    });

    test("returns 403 when user account is disabled", async () => {
      jwtVerifyMock.mockReturnValue({
        id: "disabled-user",
      });

      getJsonMock.mockResolvedValue({
        ok: true,
        data: {
          data: {
            id: "disabled-user",
            role: "USER",
            status: "DISABLED",
          },
        },
      });

      const req = createReq("Bearer valid-token");
      const res = createRes();
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
      jwtVerifyMock.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const req = createReq("Bearer invalid-token");
      const res = createRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid or expired token.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when downstream auth service throws", async () => {
      jwtVerifyMock.mockReturnValue({
        id: "user123",
      });

      getJsonMock.mockRejectedValue(
        new Error("Auth service unavailable")
      );

      const req = createReq("Bearer valid-token");
      const res = createRes();
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
    test("calls next when user has an allowed role", () => {
      const req = {
        user: {
          role: "ADMIN",
        },
      };

      const res = createRes();
      const next = jest.fn();

      const middleware = authorize("ADMIN", "VENDOR");

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test("returns 403 when user role is not allowed", () => {
      const req = {
        user: {
          role: "USER",
        },
      };

      const res = createRes();
      const next = jest.fn();

      const middleware = authorize("ADMIN");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You do not have permission for this resource.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 when req.user is missing", () => {
      const req = {};
      const res = createRes();
      const next = jest.fn();

      const middleware = authorize("ADMIN");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You do not have permission for this resource.",
      });

      expect(next).not.toHaveBeenCalled();
    });
  });
});