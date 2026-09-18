const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken", () => ({
verify: jest.fn(),
}));

jest.mock("jwks-rsa", () => jest.fn());

jest.mock("../../src/utils/serviceClient", () => ({
getJson: jest.fn(),
}));

const { getJson } = require("../../src/utils/serviceClient");

const {
authenticate,
authorize,
} = require("../../src/middleware/auth");

describe("Review Auth Middleware", () => {
let req;
let res;
let next;

beforeEach(() => {
jest.clearAllMocks();


req = {
  headers: {},
};

res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};

next = jest.fn();

process.env.JWT_SECRET = "test-secret";

delete process.env.AUTH0_DOMAIN;
delete process.env.AUTH0_AUDIENCE;
delete process.env.AUTH_SERVICE_URL;


});

describe("authenticate", () => {
test("returns 401 when Authorization header is missing", async () => {
await authenticate(req, res, next);


  expect(res.status).toHaveBeenCalledWith(401);

  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "Authentication required.",
  });

  expect(next).not.toHaveBeenCalled();
});

test("returns 401 when Authorization header is not Bearer token", async () => {
  req.headers.authorization = "Basic abc123";

  await authenticate(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);

  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "Authentication required.",
  });

  expect(jwt.verify).not.toHaveBeenCalled();
});

test("authenticates user using JWT token", async () => {
  req.headers.authorization = "Bearer valid-token";

  jwt.verify.mockReturnValue({
    id: "user123",
  });

  getJson.mockResolvedValue({
    ok: true,
    data: {
      data: {
        id: "user123",
        role: "USER",
        status: "ACTIVE",
      },
    },
  });

  await authenticate(req, res, next);

  expect(jwt.verify).toHaveBeenCalledWith(
    "valid-token",
    "test-secret"
  );

  expect(getJson).toHaveBeenCalledWith(
    "http://localhost:5002",
    "/internal/users/user123"
  );

  expect(req.user).toEqual({
    id: "user123",
    role: "USER",
    status: "ACTIVE",
  });

  expect(req.auth).toEqual({
    id: "user123",
  });

  expect(next).toHaveBeenCalled();
});

test("supports user id from Shopsphere JWT namespace claim", async () => {
  req.headers.authorization = "Bearer valid-token";

  jwt.verify.mockReturnValue({
    "https://shopsphere/user_id": "user456",
  });

  getJson.mockResolvedValue({
    ok: true,
    data: {
      data: {
        id: "user456",
        role: "USER",
        status: "ACTIVE",
      },
    },
  });

  await authenticate(req, res, next);

  expect(getJson).toHaveBeenCalledWith(
    "http://localhost:5002",
    "/internal/users/user456"
  );

  expect(req.auth).toEqual({
    "https://shopsphere/user_id": "user456",
    id: "user456",
  });

  expect(next).toHaveBeenCalled();
});

test("returns 401 when token does not contain user id", async () => {
  req.headers.authorization = "Bearer valid-token";

  jwt.verify.mockReturnValue({
    sub: "auth0-user",
  });

  await authenticate(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);

  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "Token does not contain a user id.",
  });

  expect(getJson).not.toHaveBeenCalled();
  expect(next).not.toHaveBeenCalled();
});

test("returns 401 when user account is not found", async () => {
  req.headers.authorization = "Bearer valid-token";

  jwt.verify.mockReturnValue({
    id: "user123",
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

  expect(next).not.toHaveBeenCalled();
});

test("returns 401 when auth service does not return user data", async () => {
  req.headers.authorization = "Bearer valid-token";

  jwt.verify.mockReturnValue({
    id: "user123",
  });

  getJson.mockResolvedValue({
    ok: true,
    data: {},
  });

  await authenticate(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);

  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "User account not found.",
  });

  expect(next).not.toHaveBeenCalled();
});

test("returns 403 when user account is disabled", async () => {
  req.headers.authorization = "Bearer valid-token";

  jwt.verify.mockReturnValue({
    id: "user123",
  });

  getJson.mockResolvedValue({
    ok: true,
    data: {
      data: {
        id: "user123",
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

  expect(next).not.toHaveBeenCalled();
});

test("uses configured AUTH_SERVICE_URL", async () => {
  process.env.AUTH_SERVICE_URL = "http://auth-service:5002";

  req.headers.authorization = "Bearer valid-token";

  jwt.verify.mockReturnValue({
    id: "user123",
  });

  getJson.mockResolvedValue({
    ok: true,
    data: {
      data: {
        id: "user123",
        role: "USER",
        status: "ACTIVE",
      },
    },
  });

  await authenticate(req, res, next);

  expect(getJson).toHaveBeenCalledWith(
    "http://auth-service:5002",
    "/internal/users/user123"
  );

  expect(next).toHaveBeenCalled();
});

test("returns 401 when JWT verification fails", async () => {
  req.headers.authorization = "Bearer invalid-token";

  jwt.verify.mockImplementation(() => {
    throw new Error("invalid token");
  });

  await authenticate(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);

  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "Invalid or expired token.",
  });

  expect(next).not.toHaveBeenCalled();
});

test("returns 401 when auth service request fails", async () => {
  req.headers.authorization = "Bearer valid-token";

  jwt.verify.mockReturnValue({
    id: "user123",
  });

  getJson.mockRejectedValue(
    new Error("Auth service unavailable")
  );

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
req.user = {
role: "USER",
};


  const middleware = authorize("USER");

  middleware(req, res, next);

  expect(next).toHaveBeenCalled();
  expect(res.status).not.toHaveBeenCalled();
});

test("calls next when user has one of multiple allowed roles", () => {
  req.user = {
    role: "ADMIN",
  };

  const middleware = authorize("USER", "ADMIN");

  middleware(req, res, next);

  expect(next).toHaveBeenCalled();
  expect(res.status).not.toHaveBeenCalled();
});

test("returns 403 when user is missing", () => {
  req.user = undefined;

  const middleware = authorize("USER");

  middleware(req, res, next);

  expect(res.status).toHaveBeenCalledWith(403);

  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message:
      "You do not have permission for this resource.",
  });

  expect(next).not.toHaveBeenCalled();
});

test("returns 403 when user role is not allowed", () => {
  req.user = {
    role: "VENDOR",
  };

  const middleware = authorize("USER", "ADMIN");

  middleware(req, res, next);

  expect(res.status).toHaveBeenCalledWith(403);

  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message:
      "You do not have permission for this resource.",
  });

  expect(next).not.toHaveBeenCalled();
});


});
});
