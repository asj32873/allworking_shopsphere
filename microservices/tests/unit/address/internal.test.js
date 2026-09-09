describe("Address internal middleware", () => {
  const middlewarePath =
    "../../../services/address/src/middleware/internal";

  let internal;

  function createResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    process.env.INTERNAL_SERVICE_TOKEN = "test-internal-token";

    internal = require(middlewarePath);
  });

  afterEach(() => {
    delete process.env.INTERNAL_SERVICE_TOKEN;
  });

  test("calls next when the internal service token is valid", () => {
    const req = {
      headers: {
        "x-internal-service-token": "test-internal-token",
      },
    };

    const res = createResponse();
    const next = jest.fn();

    internal(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("returns 401 when the internal service token is missing", () => {
    const req = {
      headers: {},
    };

    const res = createResponse();
    const next = jest.fn();

    internal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid internal service credentials.",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when the internal service token is incorrect", () => {
    const req = {
      headers: {
        "x-internal-service-token": "wrong-token",
      },
    };

    const res = createResponse();
    const next = jest.fn();

    internal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid internal service credentials.",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when INTERNAL_SERVICE_TOKEN is not configured", () => {
    delete process.env.INTERNAL_SERVICE_TOKEN;

    internal = require(middlewarePath);

    const req = {
      headers: {
        "x-internal-service-token": "test-internal-token",
      },
    };

    const res = createResponse();
    const next = jest.fn();

    internal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid internal service credentials.",
    });

    expect(next).not.toHaveBeenCalled();
  });
});