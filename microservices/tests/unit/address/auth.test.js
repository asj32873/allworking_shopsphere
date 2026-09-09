const jwt = require("../../../services/address/node_modules/jsonwebtoken");

const {
  getJson,
} = require("../../../services/address/src/utils/serviceClient");

const {
  authenticate,
  authorize,
} = require("../../../services/address/src/middleware/auth");

jest.mock("../../../services/address/src/utils/serviceClient", () => ({
  getJson: jest.fn(),
}));

jest.spyOn(jwt, "verify");

describe("Address auth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReset();

    process.env.JWT_SECRET = "test-secret";
    process.env.AUTH_SERVICE_URL = "http://auth:5002";

    delete process.env.AUTH0_DOMAIN;
    delete process.env.AUTH0_AUDIENCE;
  });

  function createResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  function createRequest(overrides = {}) {
    return {
      headers: {},
      ...overrides,
    };
  }

  describe("authenticate", () => {
    test("returns 401 when Authorization header is missing", async () => {
      const req = createRequest();
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

    test("returns 401 when Authorization header is not Bearer", async () => {
      const req = createRequest({
        headers: {
          authorization: "Basic abc123",
        },
      });

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

    test("authenticates a valid local JWT and loads the user", async () => {
      jwt.verify.mockReturnValue({
        id: "user-123",
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

      const req = createRequest({
        headers: {
          authorization: "Bearer valid-token",
        },
      });

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        "valid-token",
        "test-secret",
      );

      expect(getJson).toHaveBeenCalledWith(
        "http://auth:5002",
        "/internal/users/user-123",
      );

      expect(req.user).toEqual({
        _id: "user-123",
        role: "USER",
        status: "ACTIVE",
      });

      expect(req.auth).toEqual({
        id: "user-123",
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test("supports the ShopSphere user id claim", async () => {
      jwt.verify.mockReturnValue({
        "https://shopsphere/user_id": "user-456",
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            _id: "user-456",
            role: "USER",
            status: "ACTIVE",
          },
        },
      });

      const req = createRequest({
        headers: {
          authorization: "Bearer valid-token",
        },
      });

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        "valid-token",
        "test-secret",
      );

      expect(getJson).toHaveBeenCalledWith(
        "http://auth:5002",
        "/internal/users/user-456",
      );

      expect(req.auth).toEqual({
        "https://shopsphere/user_id": "user-456",
        id: "user-456",
      });

      expect(next).toHaveBeenCalledTimes(1);
    });

    test("returns 401 when token does not contain a user id", async () => {
      jwt.verify.mockReturnValue({
        sub: "auth0-subject",
      });

      const req = createRequest({
        headers: {
          authorization: "Bearer valid-token",
        },
      });

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

    test("returns 401 when auth service cannot find the user", async () => {
      jwt.verify.mockReturnValue({
        id: "missing-user",
      });

      getJson.mockResolvedValue({
        ok: false,
        data: null,
      });

      const req = createRequest({
        headers: {
          authorization: "Bearer valid-token",
        },
      });

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

    test("returns 401 when auth service response does not contain user data", async () => {
      jwt.verify.mockReturnValue({
        id: "user-123",
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {},
      });

      const req = createRequest({
        headers: {
          authorization: "Bearer valid-token",
        },
      });

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

    test("returns 403 when the user account is disabled", async () => {
      jwt.verify.mockReturnValue({
        id: "disabled-user",
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

      const req = createRequest({
        headers: {
          authorization: "Bearer valid-token",
        },
      });

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
        throw new Error("jwt malformed");
      });

      const req = createRequest({
        headers: {
          authorization: "Bearer invalid-token",
        },
      });

      const res = createResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        "invalid-token",
        "test-secret",
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid or expired token.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when auth service throws an error", async () => {
      jwt.verify.mockReturnValue({
        id: "user-123",
      });

      getJson.mockRejectedValue(new Error("Auth service unavailable"));

      const req = createRequest({
        headers: {
          authorization: "Bearer valid-token",
        },
      });

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
    test("calls next when the user has an allowed role", () => {
      const req = {
        user: {
          role: "USER",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      authorize("USER")(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test("returns 403 when the user has a different role", () => {
      const req = {
        user: {
          role: "ADMIN",
        },
      };

      const res = createResponse();
      const next = jest.fn();

      authorize("USER")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You do not have permission for this resource.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 when there is no authenticated user", () => {
      const req = {};

      const res = createResponse();
      const next = jest.fn();

      authorize("USER")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You do not have permission for this resource.",
      });

      expect(next).not.toHaveBeenCalled();
    });
  });
});