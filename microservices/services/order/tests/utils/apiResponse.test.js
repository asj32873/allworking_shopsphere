const {
  ok,
  fail,
} = require("../../src/utils/apiResponse");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("apiResponse", () => {
  test("ok returns successful response", () => {
    const res = createResponse();

    ok(res, { id: "order-1" });

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "OK",
      data: {
        id: "order-1",
      },
    });
  });

  test("ok supports custom message and status", () => {
    const res = createResponse();

    ok(
      res,
      { id: "order-1" },
      "Order created.",
      201,
    );

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Order created.",
      data: {
        id: "order-1",
      },
    });
  });

  test("fail returns error response", () => {
    const res = createResponse();

    fail(
      res,
      "Order not found.",
      404,
    );

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Order not found.",
    });
  });

  test("fail includes details when supplied", () => {
    const res = createResponse();

    fail(
      res,
      "Validation failed.",
      400,
      {
        field: "addressId",
      },
    );

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation failed.",
      details: {
        field: "addressId",
      },
    });
  });
});