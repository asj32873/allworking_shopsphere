const validate = require("../../../services/address/src/middleware/validate");

describe("Address validate middleware", () => {
  function createResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  const schema = {
    safeParse: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("calls next and replaces request body with parsed data when validation succeeds", () => {
    const originalBody = {
      name: "John",
      city: "Bengaluru",
      extraField: "remove-me",
    };

    const parsedBody = {
      name: "John",
      city: "Bengaluru",
    };

    schema.safeParse.mockReturnValue({
      success: true,
      data: parsedBody,
    });

    const req = {
      body: originalBody,
    };

    const res = createResponse();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(schema.safeParse).toHaveBeenCalledWith(originalBody);

    expect(req.body).toEqual(parsedBody);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("returns 400 when body validation fails", () => {
    const originalBody = {
      addressLine: "",
      pincode: "abc",
    };

    schema.safeParse.mockReturnValue({
      success: false,
      error: {
        issues: [
          {
            path: ["addressLine"],
            message: "Address line is required",
          },
          {
            path: ["pincode"],
            message: "Invalid pincode",
          },
        ],
      },
    });

    const req = {
      body: originalBody,
    };

    const res = createResponse();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(schema.safeParse).toHaveBeenCalledWith(originalBody);

    expect(req.body).toEqual(originalBody);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid request.",
      details: [
        {
          path: ["addressLine"],
          message: "Address line is required",
        },
        {
          path: ["pincode"],
          message: "Invalid pincode",
        },
      ],
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("validates query parameters when source is query", () => {
    const originalQuery = {
      page: "2",
    };

    const parsedQuery = {
      page: 2,
    };

    schema.safeParse.mockReturnValue({
      success: true,
      data: parsedQuery,
    });

    const req = {
      query: originalQuery,
    };

    const res = createResponse();
    const next = jest.fn();

    validate(schema, "query")(req, res, next);

    expect(schema.safeParse).toHaveBeenCalledWith(originalQuery);

    expect(req.query).toEqual(parsedQuery);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("validates params when source is params", () => {
    const originalParams = {
      id: "address-123",
    };

    const parsedParams = {
      id: "address-123",
    };

    schema.safeParse.mockReturnValue({
      success: true,
      data: parsedParams,
    });

    const req = {
      params: originalParams,
    };

    const res = createResponse();
    const next = jest.fn();

    validate(schema, "params")(req, res, next);

    expect(schema.safeParse).toHaveBeenCalledWith(originalParams);

    expect(req.params).toEqual(parsedParams);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("handles validation issues with an empty path", () => {
    schema.safeParse.mockReturnValue({
      success: false,
      error: {
        issues: [
          {
            path: [],
            message: "Invalid request",
          },
        ],
      },
    });

    const req = {
      body: {},
    };

    const res = createResponse();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid request.",
      details: [
        {
          path: [],
          message: "Invalid request",
        },
      ],
    });

    expect(next).not.toHaveBeenCalled();
  });
});