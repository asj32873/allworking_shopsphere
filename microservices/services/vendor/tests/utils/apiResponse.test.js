const { ok, fail } = require("../../src/utils/apiResponse");

describe("apiResponse", () => {
  test("ok sends success response with defaults", () => {
    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };
    ok(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ success: true, message: "OK", data: { id: 1 } });
  });

  test("ok accepts custom message and status", () => {
    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };
    ok(res, "x", "Created", 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ success: true, message: "Created", data: "x" });
  });

  test("fail omits details when details is falsy", () => {
    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };
    fail(res, "Bad", 422, undefined);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith({ success: false, message: "Bad" });
  });

  test("fail includes details when provided", () => {
    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };
    fail(res, "Bad", 400, { field: "email" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false, message: "Bad", details: { field: "email" }
    });
  });
});

