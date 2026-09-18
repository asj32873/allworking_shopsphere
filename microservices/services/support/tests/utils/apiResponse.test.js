const { ok, fail } = require("../../src/utils/apiResponse");

describe("apiResponse", () => {
  const res = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  test("ok uses defaults", () => {
    const r = res();
    expect(ok(r, { id: 1 })).toBe(r);
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({
      success: true,
      message: "OK",
      data: { id: 1 },
    });
  });

  test("ok supports custom message and status", () => {
    const r = res();
    ok(r, [1], "Created", 201);
    expect(r.status).toHaveBeenCalledWith(201);
    expect(r.json).toHaveBeenCalledWith({
      success: true,
      message: "Created",
      data: [1],
    });
  });

  test("fail omits details when not supplied", () => {
    const r = res();
    fail(r, "Bad request");
    expect(r.status).toHaveBeenCalledWith(400);
    expect(r.json).toHaveBeenCalledWith({
      success: false,
      message: "Bad request",
    });
  });

  test("fail includes details when supplied", () => {
    const r = res();
    fail(r, "Invalid", 422, { field: "subject" });
    expect(r.status).toHaveBeenCalledWith(422);
    expect(r.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid",
      details: { field: "subject" },
    });
  });
});

