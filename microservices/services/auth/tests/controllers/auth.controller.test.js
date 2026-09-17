const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

jest.mock("../../src/models/User", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  exists: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
  postJson: jest.fn(),
}));

jest.mock("../../src/utils/auth0", () => ({
  verifyAuth0Token: jest.fn(),
  getAuth0UserInfo: jest.fn(),
}));

jest.mock("../../src/utils/apiResponse", () => ({
  ok: jest.fn((res, data, message = "OK", status = 200) =>
    res.status(status).json({
      success: true,
      message,
      data,
    }),
  ),

  fail: jest.fn((res, message, status = 400, details) =>
    res.status(status).json({
      success: false,
      message,
      ...(details ? { details } : {}),
    }),
  ),
}));

const User = require("../../src/models/User");
const { getJson, postJson } = require("../../src/utils/serviceClient");
const { verifyAuth0Token, getAuth0UserInfo } = require("../../src/utils/auth0");

const controller = require("../../src/controllers/auth.controller");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function makeUser(overrides = {}) {
  return {
    _id: {
      toString: () => "user-123",
    },
    name: "Test User",
    email: "test@example.com",
    phone: "9999999999",
    role: "USER",
    status: "ACTIVE",
    passwordHash: "hashed-password",
    auth0Sub: null,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function findOneWithPassword(user) {
  User.findOne.mockReturnValue({
    select: jest.fn().mockResolvedValue(user),
  });
}

function findByIdAndUpdateLean(user) {
  User.findByIdAndUpdate.mockReturnValue({
    lean: jest.fn().mockResolvedValue(user),
  });
}

describe("auth.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "7d";
    process.env.BCRYPT_SALT_ROUNDS = "4";
  });

  describe("register", () => {
    test("creates a normal USER account", async () => {
      const user = makeUser();

      User.exists.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed-password");
      User.create.mockResolvedValue(user);
      jwt.sign.mockReturnValue("shopsphere-token");

      const req = {
        body: {
          name: "Test User",
          email: " TEST@Example.COM ",
          phone: "9999999999",
          password: "secret123",
        },
      };
      const res = createResponse();

      await controller.register(req, res);

      expect(User.exists).toHaveBeenCalledWith({
        email: "test@example.com",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 4);

      expect(User.create).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        phone: "9999999999",
        passwordHash: "hashed-password",
        role: "USER",
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: "user-123",
          role: "USER",
          type: "shopsphere",
        },
        "test-secret",
        {
          expiresIn: "7d",
          algorithm: "HS256",
        },
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Account created.",
        }),
      );
    });

    test("returns 409 when email already exists", async () => {
      User.exists.mockResolvedValue({ _id: "existing" });

      const req = {
        body: {
          name: "Test User",
          email: "TEST@EXAMPLE.COM",
          password: "secret123",
        },
      };
      const res = createResponse();

      await controller.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email already exists.",
      });
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    test("fails when JWT_SECRET is not configured", async () => {
      delete process.env.JWT_SECRET;

      const user = makeUser();

      User.exists.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed-password");
      User.create.mockResolvedValue(user);

      const req = {
        body: {
          name: "Test User",
          email: "test@example.com",
          phone: "9999999999",
          password: "secret123",
        },
      };

      const res = createResponse();

      await expect(controller.register(req, res)).rejects.toThrow(
        "JWT_SECRET is not configured.",
      );

      expect(jwt.sign).not.toHaveBeenCalled();
    });
    test("logs in an active USER with the correct password", async () => {
      const user = makeUser();

      findOneWithPassword(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("shopsphere-token");

      const req = {
        body: {
          email: " TEST@Example.COM ",
          password: "secret123",
        },
      };
      const res = createResponse();

      await controller.login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "secret123",
        "hashed-password",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Login successful.",
        }),
      );
    });

    test("returns 401 when user does not exist", async () => {
      findOneWithPassword(null);

      const req = {
        body: {
          email: "missing@example.com",
          password: "secret123",
        },
      };
      const res = createResponse();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid credentials.",
      });
    });

    test("returns 401 when password is incorrect", async () => {
      findOneWithPassword(makeUser());
      bcrypt.compare.mockResolvedValue(false);

      const req = {
        body: {
          email: "test@example.com",
          password: "wrong-password",
        },
      };
      const res = createResponse();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid credentials.",
      });
    });

    test("returns 403 for a disabled account", async () => {
      findOneWithPassword(makeUser({ status: "DISABLED" }));

      const req = {
        body: {
          email: "test@example.com",
          password: "secret123",
        },
      };
      const res = createResponse();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Account disabled.",
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("requires VENDOR accounts to be verified", async () => {
      const vendor = makeUser({ role: "VENDOR" });

      findOneWithPassword(vendor);
      bcrypt.compare.mockResolvedValue(true);

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            status: "APPLIED",
          },
        },
      });

      const req = {
        body: {
          email: "vendor@example.com",
          password: "secret123",
        },
      };
      const res = createResponse();

      await controller.login(req, res);

      expect(getJson).toHaveBeenCalledWith(
        "http://localhost:5012",
        "/internal/vendors/by-user/user-123",
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendor is not verified yet.",
      });
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    test("allows a VERIFIED VENDOR to log in", async () => {
      const vendor = makeUser({ role: "VENDOR" });

      findOneWithPassword(vendor);
      bcrypt.compare.mockResolvedValue(true);
      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            status: "VERIFIED",
          },
        },
      });
      jwt.sign.mockReturnValue("vendor-token");

      const req = {
        body: {
          email: "vendor@example.com",
          password: "secret123",
        },
      };
      const res = createResponse();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Login successful.",
        }),
      );
    });
  });

  describe("auth0Login", () => {
    test("returns 400 when token is missing", async () => {
      const req = { body: {} };
      const res = createResponse();

      await controller.auth0Login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Auth0 access token is required.",
      });
    });

    test("returns 401 when Auth0 token has no subject", async () => {
      verifyAuth0Token.mockResolvedValue({});

      const req = {
        body: { token: "auth0-token" },
      };
      const res = createResponse();

      await controller.auth0Login(req, res);

      expect(verifyAuth0Token).toHaveBeenCalledWith("auth0-token");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Auth0 token does not contain a subject.",
      });
    });

    test("returns 401 when /userinfo subject does not match token subject", async () => {
      verifyAuth0Token.mockResolvedValue({
        sub: "auth0|123",
      });

      getAuth0UserInfo.mockResolvedValue({
        sub: "auth0|different",
        email: "test@example.com",
        email_verified: true,
      });

      const req = {
        body: { token: "auth0-token" },
      };
      const res = createResponse();

      await controller.auth0Login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Auth0 identity verification failed.",
      });
    });

    test("returns 400 when Auth0 profile has no email", async () => {
      verifyAuth0Token.mockResolvedValue({
        sub: "auth0|123",
      });

      getAuth0UserInfo.mockResolvedValue({
        sub: "auth0|123",
        email_verified: true,
      });

      const req = {
        body: { token: "auth0-token" },
      };
      const res = createResponse();

      await controller.auth0Login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Your Auth0 account did not provide an email address.",
      });
    });

    test("returns 403 when Auth0 email is not verified", async () => {
      verifyAuth0Token.mockResolvedValue({
        sub: "auth0|123",
      });

      getAuth0UserInfo.mockResolvedValue({
        sub: "auth0|123",
        email: "test@example.com",
        email_verified: false,
      });

      const req = {
        body: { token: "auth0-token" },
      };
      const res = createResponse();

      await controller.auth0Login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Your Auth0 email address must be verified.",
      });
    });

    test("creates a new ShopSphere user for a new Auth0 identity", async () => {
      const createdUser = makeUser({
        name: "Auth0 User",
        email: "auth@example.com",
        auth0Sub: "auth0|new-user",
      });

      verifyAuth0Token.mockResolvedValue({
        sub: "auth0|new-user",
      });

      getAuth0UserInfo.mockResolvedValue({
        sub: "auth0|new-user",
        email: "AUTH@EXAMPLE.COM",
        email_verified: true,
        name: "Auth0 User",
      });

      User.findOne
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(null),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(null),
        });

      User.create.mockResolvedValue(createdUser);
      jwt.sign.mockReturnValue("shopsphere-auth0-token");

      const req = {
        body: { token: "auth0-token" },
      };
      const res = createResponse();

      await controller.auth0Login(req, res);

      expect(User.create).toHaveBeenCalledWith({
        name: "Auth0 User",
        email: "auth@example.com",
        auth0Sub: "auth0|new-user",
        role: "USER",
        status: "ACTIVE",
      });

      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Login successful.",
        }),
      );
    });

    test("links an existing ShopSphere account by email", async () => {
      const existingUser = makeUser({
        email: "test@example.com",
        auth0Sub: null,
      });

      verifyAuth0Token.mockResolvedValue({
        sub: "google-oauth2|123",
      });

      getAuth0UserInfo.mockResolvedValue({
        sub: "google-oauth2|123",
        email: "TEST@EXAMPLE.COM",
        email_verified: true,
        name: "Test User",
      });

      User.findOne
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(null),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(existingUser),
        });

      jwt.sign.mockReturnValue("shopsphere-linked-token");

      const req = {
        body: { token: "auth0-token" },
      };
      const res = createResponse();

      await controller.auth0Login(req, res);

      expect(existingUser.auth0Sub).toBe("google-oauth2|123");
      expect(existingUser.save).toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 403 when an Auth0-linked account is disabled", async () => {
      const disabledUser = makeUser({
        status: "DISABLED",
        auth0Sub: "auth0|disabled",
      });

      verifyAuth0Token.mockResolvedValue({
        sub: "auth0|disabled",
      });

      getAuth0UserInfo.mockResolvedValue({
        sub: "auth0|disabled",
        email: "disabled@example.com",
        email_verified: true,
      });

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(disabledUser),
      });

      const req = {
        body: { token: "auth0-token" },
      };
      const res = createResponse();

      await controller.auth0Login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Account disabled.",
      });
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    test("returns 401 when Auth0 verification throws", async () => {
      verifyAuth0Token.mockRejectedValue(new Error("expired"));

      const req = {
        body: { token: "expired-token" },
      };
      const res = createResponse();

      await controller.auth0Login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid or expired Auth0 token.",
      });
    });
  });

  describe("me", () => {
    test("returns the authenticated user", async () => {
      const req = {
        user: {
          id: "user-123",
          role: "USER",
        },
      };
      const res = createResponse();

      await controller.me(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: req.user,
      });
    });
  });

  describe("internalUser", () => {
    test("returns a user and removes passwordHash", async () => {
      const user = {
        _id: "user-123",
        name: "Test User",
        passwordHash: "secret",
      };

      User.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(user),
      });

      const req = { params: { id: "user-123" } };
      const res = createResponse();

      await controller.internalUser(req, res);

      expect(User.findById).toHaveBeenCalledWith("user-123");
      expect(user.passwordHash).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 404 when user does not exist", async () => {
      User.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const req = { params: { id: "missing-user" } };
      const res = createResponse();

      await controller.internalUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User not found.",
      });
    });
  });

  describe("internalUsers", () => {
    test("lists users without passwordHash", async () => {
      const users = [
        { _id: "user-1", email: "one@example.com" },
        { _id: "user-2", email: "two@example.com" },
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(users),
          }),
        }),
      });

      const req = {};
      const res = createResponse();

      await controller.internalUsers(req, res);

      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: users,
      });
    });
  });

  describe("updateInternal", () => {
    test("updates only allowed fields", async () => {
      const updatedUser = {
        _id: "user-123",
        name: "Updated",
        phone: "9999999999",
        role: "USER",
        status: "ACTIVE",
        passwordHash: "secret",
      };

      findByIdAndUpdateLean(updatedUser);

      const req = {
        params: { id: "user-123" },
        body: {
          name: "Updated",
          phone: "9999999999",
          role: "USER",
          status: "ACTIVE",
          email: "should-not-update@example.com",
          passwordHash: "should-not-update",
        },
      };
      const res = createResponse();

      await controller.updateInternal(req, res);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user-123",
        {
          name: "Updated",
          phone: "9999999999",
          role: "USER",
          status: "ACTIVE",
        },
        {
          new: true,
          runValidators: true,
        },
      );

      expect(updatedUser.passwordHash).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 404 when user does not exist", async () => {
      findByIdAndUpdateLean(null);

      const req = {
        params: { id: "missing-user" },
        body: { name: "Updated" },
      };
      const res = createResponse();

      await controller.updateInternal(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User not found.",
      });
    });
  });
  describe("registerVendor", () => {
    test("creates vendor application successfully", async () => {
      const user = makeUser({
        role: "VENDOR",
      });

      User.exists.mockResolvedValue(null);

      bcrypt.hash.mockResolvedValue("hashed-password");

      User.create.mockResolvedValue(user);

      postJson.mockResolvedValue({
        ok: true,
        status: 201,
        data: {
          data: {
            id: "vendor-123",
            status: "APPLIED",
          },
        },
      });

      const req = {
        body: {
          ownerName: "Vendor Owner",
          storeName: "Test Store",
          email: " VENDOR@Example.COM ",
          phone: "9999999999",
          storeAddress: "123 Main Street",
          password: "secret123",
        },
      };

      const res = createResponse();

      await controller.registerVendor(req, res);

      expect(User.exists).toHaveBeenCalledWith({
        email: "vendor@example.com",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 4);

      expect(User.create).toHaveBeenCalledWith({
        name: "Vendor Owner",
        email: "vendor@example.com",
        phone: "9999999999",
        passwordHash: "hashed-password",
        role: "VENDOR",
      });

      expect(postJson).toHaveBeenCalledWith(
        "http://localhost:5012",
        "/internal/vendors",
        {
          userId: user._id,
          storeName: "Test Store",
          email: "vendor@example.com",
          phone: "9999999999",
          storeAddress: "123 Main Street",
          status: "APPLIED",
        },
      );

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Vendor application submitted.",
        }),
      );
    });

    test("returns 409 when vendor email already exists", async () => {
      User.exists.mockResolvedValue({
        _id: "existing-user",
      });

      const req = {
        body: {
          ownerName: "Vendor Owner",
          storeName: "Test Store",
          email: " VENDOR@EXAMPLE.COM ",
          phone: "9999999999",
          storeAddress: "123 Main Street",
          password: "secret123",
        },
      };

      const res = createResponse();

      await controller.registerVendor(req, res);

      expect(User.exists).toHaveBeenCalledWith({
        email: "vendor@example.com",
      });

      expect(res.status).toHaveBeenCalledWith(409);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email already exists.",
      });

      expect(User.create).not.toHaveBeenCalled();

      expect(postJson).not.toHaveBeenCalled();
    });

    test("rolls back user when vendor service fails", async () => {
      const user = makeUser({
        role: "VENDOR",
      });

      User.exists.mockResolvedValue(null);

      bcrypt.hash.mockResolvedValue("hashed-password");

      User.create.mockResolvedValue(user);

      postJson.mockResolvedValue({
        ok: false,
        status: 502,
        data: {
          success: false,
          message: "Vendor service unavailable.",
        },
      });

      const req = {
        body: {
          ownerName: "Vendor Owner",
          storeName: "Test Store",
          email: "vendor@example.com",
          phone: "9999999999",
          storeAddress: "123 Main Street",
          password: "secret123",
        },
      };

      const res = createResponse();

      await controller.registerVendor(req, res);

      expect(User.create).toHaveBeenCalledWith({
        name: "Vendor Owner",
        email: "vendor@example.com",
        phone: "9999999999",
        passwordHash: "hashed-password",
        role: "VENDOR",
      });

      expect(postJson).toHaveBeenCalled();

      expect(User.findByIdAndDelete).toHaveBeenCalledWith(user._id);

      expect(res.status).toHaveBeenCalledWith(502);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendor service unavailable.",
      });

      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
});
