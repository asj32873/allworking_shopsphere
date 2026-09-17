jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
}));

const { getJson } = require("../../src/utils/serviceClient");

describe("auth", () => {
  const originalEnv = process.env;

  const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: "secret",
      AUTH_SERVICE_URL: "http://auth",
    };

    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("missing Authorization header", async () => {
    const { authenticate } = require("../../src/middleware/auth");

    const res = makeRes();
    const next = jest.fn();

    await authenticate({ headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication required.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("valid JWT authenticates user", async () => {
    const jwt = require("jsonwebtoken");

    jest.spyOn(jwt, "verify").mockReturnValue({
      id: "u 1",
    });

    getJson.mockResolvedValueOnce({
      ok: true,
      data: {
        data: {
          id: "u 1",
          role: "USER",
          status: "ACTIVE",
        },
      },
    });

    const { authenticate } = require("../../src/middleware/auth");

    const req = {
      headers: {
        authorization: "Bearer valid-token",
      },
    };

    const res = makeRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(getJson).toHaveBeenCalledWith(
      "http://auth",
      "/internal/users/u%201",
    );

    expect(req.user).toEqual({
      id: "u 1",
      role: "USER",
      status: "ACTIVE",
    });

    expect(req.auth).toEqual({
      id: "u 1",
    });

    expect(next).toHaveBeenCalled();
  });

  test("supports Auth0 user id claim through JWT fallback", async () => {
    const jwt = require("jsonwebtoken");

    jest.spyOn(jwt, "verify").mockReturnValue({
      "https://shopsphere/user_id": "auth0-user",
    });

    getJson.mockResolvedValueOnce({
      ok: true,
      data: {
        data: {
          id: "auth0-user",
          role: "USER",
          status: "ACTIVE",
        },
      },
    });

    const { authenticate } = require("../../src/middleware/auth");

    const req = {
      headers: {
        authorization: "Bearer token",
      },
    };

    const res = makeRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(getJson).toHaveBeenCalledWith(
      "http://auth",
      "/internal/users/auth0-user",
    );

    expect(req.auth.id).toBe("auth0-user");
    expect(next).toHaveBeenCalled();
  });

  test("rejects token without user id", async () => {
    const jwt = require("jsonwebtoken");

    jest.spyOn(jwt, "verify").mockReturnValue({
      role: "USER",
    });

    const { authenticate } = require("../../src/middleware/auth");

    const res = makeRes();

    await authenticate(
      {
        headers: {
          authorization: "Bearer token",
        },
      },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token does not contain a user id.",
    });
  });

  test("rejects missing downstream user", async () => {
    const jwt = require("jsonwebtoken");

    jest.spyOn(jwt, "verify").mockReturnValue({
      id: "u",
    });

    getJson.mockResolvedValueOnce({
      ok: false,
    });

    const { authenticate } = require("../../src/middleware/auth");

    const res = makeRes();

    await authenticate(
      {
        headers: {
          authorization: "Bearer token",
        },
      },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User account not found.",
    });
  });

  test("rejects disabled account", async () => {
    const jwt = require("jsonwebtoken");

    jest.spyOn(jwt, "verify").mockReturnValue({
      id: "u",
    });

    getJson.mockResolvedValueOnce({
      ok: true,
      data: {
        data: {
          id: "u",
          role: "USER",
          status: "DISABLED",
        },
      },
    });

    const { authenticate } = require("../../src/middleware/auth");

    const res = makeRes();

    await authenticate(
      {
        headers: {
          authorization: "Bearer token",
        },
      },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Account disabled.",
    });
  });

  test("rejects invalid JWT", async () => {
    const jwt = require("jsonwebtoken");

    jest.spyOn(jwt, "verify").mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    const { authenticate } = require("../../src/middleware/auth");

    const res = makeRes();

    await authenticate(
      {
        headers: {
          authorization: "Bearer token",
        },
      },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid or expired token.",
    });
  });

  test("authorize allows permitted role", () => {
    const { authorize } = require("../../src/middleware/auth");

    const next = jest.fn();

    authorize("USER")(
      {
        user: {
          role: "USER",
        },
      },
      makeRes(),
      next,
    );

    expect(next).toHaveBeenCalled();
  });

  test("authorize rejects missing user", () => {
    const { authorize } = require("../../src/middleware/auth");

    const res = makeRes();

    authorize("USER")({}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "You do not have permission for this resource.",
    });
  });

  test("authorize rejects incorrect role", () => {
    const { authorize } = require("../../src/middleware/auth");

    const res = makeRes();

    authorize("USER")(
      {
        user: {
          role: "ADMIN",
        },
      },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });
});



// jest.mock("../../src/utils/serviceClient",()=>({getJson:jest.fn()}));const jwt=require("jsonwebtoken"),{getJson}=require("../../src/utils/serviceClient");
// describe("auth",()=>{const old=process.env;let authenticate,authorize;const res=()=>({status:jest.fn().mockReturnThis(),json:jest.fn().mockReturnThis()});beforeEach(()=>{jest.resetModules();process.env={...old,JWT_SECRET:"secret",AUTH_SERVICE_URL:"http://auth"};jest.clearAllMocks();({authenticate,authorize}=require("../../src/middleware/auth"))});afterAll(()=>process.env=old);
// test("missing header",async()=>{const r=res(),n=jest.fn();await authenticate({headers:{}},r,n);expect(r.status).toHaveBeenCalledWith(401);expect(n).not.toHaveBeenCalled()});
// test("valid JWT",async()=>{jest.spyOn(jwt,"verify").mockReturnValueOnce({id:"u 1"});getJson.mockResolvedValueOnce({ok:true,data:{data:{id:"u 1",role:"USER",status:"ACTIVE"}}});const q={headers:{authorization:"Bearer t"}};const n=jest.fn();await authenticate(q,res(),n);expect(getJson).toHaveBeenCalledWith("http://auth","/internal/users/u%201");expect(q.auth.id).toBe("u 1");expect(n).toHaveBeenCalled()});
// test("claim user id",async()=>{jest.spyOn(jwt,"verify").mockReturnValueOnce({"https://shopsphere/user_id":"u"});getJson.mockResolvedValueOnce({ok:true,data:{data:{id:"u",role:"USER"}}});const q={headers:{authorization:"Bearer t"}};const n=jest.fn();await authenticate(q,res(),n);expect(q.auth.id).toBe("u")});
// test("no user id",async()=>{jest.spyOn(jwt,"verify").mockReturnValueOnce({});const r=res();await authenticate({headers:{authorization:"Bearer t"}},r,()=>{});expect(r.status).toHaveBeenCalledWith(401)});
// test("downstream missing",async()=>{jest.spyOn(jwt,"verify").mockReturnValueOnce({id:"u"});getJson.mockResolvedValueOnce({ok:false});const r=res();await authenticate({headers:{authorization:"Bearer t"}},r,()=>{});expect(r.status).toHaveBeenCalledWith(401)});
// test("disabled",async()=>{jest.spyOn(jwt,"verify").mockReturnValueOnce({id:"u"});getJson.mockResolvedValueOnce({ok:true,data:{data:{role:"USER",status:"DISABLED"}}});const r=res();await authenticate({headers:{authorization:"Bearer t"}},r,()=>{});expect(r.status).toHaveBeenCalledWith(403)});
// test("JWT error",async()=>{jest.spyOn(jwt,"verify").mockImplementationOnce(()=>{throw new Error("bad")});const r=res();await authenticate({headers:{authorization:"Bearer t"}},r,()=>{});expect(r.status).toHaveBeenCalledWith(401)});
// test("authorize allows USER",()=>{const n=jest.fn();authorize("USER")({user:{role:"USER"}},res(),n);expect(n).toHaveBeenCalled()});
// test("authorize rejects role",()=>{const r=res();authorize("USER")({user:{role:"ADMIN"}},r,()=>{});expect(r.status).toHaveBeenCalledWith(403)})});
