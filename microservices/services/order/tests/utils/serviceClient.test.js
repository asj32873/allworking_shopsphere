const {
  request,
  getJson,
  postJson,
  putJson,
  patchJson,
  deleteJson,
  getCircuitStatus,
} = require("../../src/utils/serviceClient");

describe("serviceClient", () => {
  const BASE_URL = "http://localhost:5000";
  const PATH = "/api/test";

  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn();

    process.env.INTERNAL_SERVICE_TOKEN = "test-internal-token";
  });

  afterEach(() => {
    delete process.env.INTERNAL_SERVICE_TOKEN;
    jest.restoreAllMocks();
  });

  function mockResponse({
    ok = true,
    status = 200,
    data = { success: true },
  } = {}) {
    return {
      ok,
      status,
      text: jest.fn().mockResolvedValue(
        data === null ? "" : JSON.stringify(data),
      ),
    };
  }

  // -------------------------------------------------------
  // BASIC REQUEST
  // -------------------------------------------------------

  describe("request", () => {
    test("makes a GET request successfully", async () => {
      global.fetch.mockResolvedValue(
        mockResponse({
          ok: true,
          status: 200,
          data: {
            success: true,
            data: { id: "1" },
          },
        }),
      );

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 0,
        },
      );

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toEqual({
        success: true,
        data: { id: "1" },
      });

      expect(result.attempts).toBe(1);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/test",
        expect.objectContaining({
          method: "GET",
        }),
      );
    });

    test("removes trailing slash from base URL", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await request(
        "http://localhost:5000/",
        "/api/test",
        {
          method: "GET",
          retries: 0,
        },
      );

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/test",
        expect.any(Object),
      );
    });

    test("defaults to GET when method is not provided", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await request(
        BASE_URL,
        PATH,
        {
          retries: 0,
        },
      );

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/test",
        expect.objectContaining({
          method: "GET",
        }),
      );
    });
  });

  // -------------------------------------------------------
  // HEADERS
  // -------------------------------------------------------

  describe("headers", () => {
    test("adds internal service token when configured", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 0,
        },
      );

      const options = global.fetch.mock.calls[0][1];

      expect(
        options.headers["x-internal-service-token"],
      ).toBe("test-internal-token");
    });

    test("does not overwrite existing internal service token", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 0,
          headers: {
            "x-internal-service-token": "custom-token",
          },
        },
      );

      const options = global.fetch.mock.calls[0][1];

      expect(
        options.headers["x-internal-service-token"],
      ).toBe("custom-token");
    });

    test("preserves custom headers", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 0,
          headers: {
            Authorization: "Bearer test-token",
            "x-custom-header": "hello",
          },
        },
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.headers.Authorization).toBe(
        "Bearer test-token",
      );

      expect(
        options.headers["x-custom-header"],
      ).toBe("hello");
    });

    test("preserves existing x-request-id", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 0,
          headers: {
            "x-request-id": "request-123",
          },
        },
      );

      const options = global.fetch.mock.calls[0][1];

      expect(
        options.headers["x-request-id"],
      ).toBe("request-123");
    });

    test("preserves existing X-Request-Id", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 0,
          headers: {
            "X-Request-Id": "request-456",
          },
        },
      );

      const options = global.fetch.mock.calls[0][1];

      expect(
        options.headers["X-Request-Id"],
      ).toBe("request-456");
    });

    test("generates x-request-id when missing", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 0,
        },
      );

      const options = global.fetch.mock.calls[0][1];

      expect(
        options.headers["x-request-id"],
      ).toBeDefined();

      expect(
        typeof options.headers["x-request-id"],
      ).toBe("string");
    });
  });

  // -------------------------------------------------------
  // BODY HANDLING
  // -------------------------------------------------------

  describe("request body", () => {
    test("serializes object body as JSON", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await request(
        BASE_URL,
        PATH,
        {
          method: "POST",
          retries: 0,
          body: {
            name: "Phone",
            price: 100,
          },
        },
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.body).toBe(
        JSON.stringify({
          name: "Phone",
          price: 100,
        }),
      );

      expect(
        options.headers["content-type"],
      ).toBe("application/json");
    });

    test("does not serialize string body", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await request(
        BASE_URL,
        PATH,
        {
          method: "POST",
          retries: 0,
          body: "raw-body",
        },
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.body).toBe("raw-body");
    });

    test("preserves existing Content-Type header", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await request(
        BASE_URL,
        PATH,
        {
          method: "POST",
          retries: 0,
          headers: {
            "Content-Type": "application/custom+json",
          },
          body: {
            test: true,
          },
        },
      );

      const options = global.fetch.mock.calls[0][1];

      expect(
        options.headers["Content-Type"],
      ).toBe("application/custom+json");
    });
  });

  // -------------------------------------------------------
  // RESPONSE PARSING
  // -------------------------------------------------------

  describe("response parsing", () => {
    test("parses valid JSON response", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: jest.fn().mockResolvedValue(
      JSON.stringify({
        data: {
          id: "123",
        },
      })
    ),
  });

  const result = await getJson(
    "http://localhost:5000",
    "/api/test"
  );

  expect(result.data).toEqual({
    data: {
      id: "123",
    },
  });
});

    test("returns null for empty response", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 204,
        text: jest.fn().mockResolvedValue(""),
      });

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 0,
        },
      );

      expect(result.ok).toBe(true);
      expect(result.data).toBeNull();
    });

    test("handles invalid JSON response", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(
          "not-valid-json",
        ),
      });

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 0,
        },
      );

      expect(result.data).toEqual({
        success: false,
        message:
          "Invalid JSON response from downstream service.",
        raw: "not-valid-json",
      });
    });
  });

  // -------------------------------------------------------
  // RETRIES
  // -------------------------------------------------------

  describe("retry behavior", () => {
    test("retries GET on 500", async () => {
      global.fetch
        .mockResolvedValueOnce(
          mockResponse({
            ok: false,
            status: 500,
            data: {
              message: "Server error",
            },
          }),
        )
        .mockResolvedValueOnce(
          mockResponse({
            ok: true,
            status: 200,
            data: {
              success: true,
            },
          }),
        );

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 1,
          retrySafe: false,
          timeoutMs: 1000,
        },
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);

      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });

    test("retries GET on 503", async () => {
      global.fetch
        .mockResolvedValueOnce(
          mockResponse({
            ok: false,
            status: 503,
          }),
        )
        .mockResolvedValueOnce(
          mockResponse({
            ok: true,
            status: 200,
          }),
        );

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 1,
        },
      );

      expect(
        global.fetch,
      ).toHaveBeenCalledTimes(2);

      expect(result.ok).toBe(true);
    });

    test("retries GET on 408", async () => {
      global.fetch
        .mockResolvedValueOnce(
          mockResponse({
            ok: false,
            status: 408,
          }),
        )
        .mockResolvedValueOnce(
          mockResponse({
            ok: true,
            status: 200,
          }),
        );

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 1,
        },
      );

      expect(
        global.fetch,
      ).toHaveBeenCalledTimes(2);

      expect(result.ok).toBe(true);
    });

    test("retries GET on 429", async () => {
      global.fetch
        .mockResolvedValueOnce(
          mockResponse({
            ok: false,
            status: 429,
          }),
        )
        .mockResolvedValueOnce(
          mockResponse({
            ok: true,
            status: 200,
          }),
        );

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 1,
        },
      );

      expect(
        global.fetch,
      ).toHaveBeenCalledTimes(2);

      expect(result.ok).toBe(true);
    });

    test("does not retry unsafe POST by default", async () => {
      global.fetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 500,
        }),
      );

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "POST",
          retries: 3,
        },
      );

      expect(
        global.fetch,
      ).toHaveBeenCalledTimes(1);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(500);
      expect(result.attempts).toBe(1);
    });

    test("retries POST when retrySafe is true", async () => {
      global.fetch
        .mockResolvedValueOnce(
          mockResponse({
            ok: false,
            status: 500,
          }),
        )
        .mockResolvedValueOnce(
          mockResponse({
            ok: true,
            status: 200,
          }),
        );

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "POST",
          retries: 1,
          retrySafe: true,
        },
      );

      expect(
        global.fetch,
      ).toHaveBeenCalledTimes(2);

      expect(result.ok).toBe(true);
    });

    test("does not retry 400 business errors", async () => {
      global.fetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 400,
          data: {
            success: false,
            message: "Bad request",
          },
        }),
      );

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 3,
        },
      );

      expect(
        global.fetch,
      ).toHaveBeenCalledTimes(1);

      expect(result.status).toBe(400);
      expect(result.attempts).toBe(1);
    });
  });

  // -------------------------------------------------------
  // NETWORK ERRORS
  // -------------------------------------------------------

  describe("network failures", () => {
    test("retries GET after network failure", async () => {
      global.fetch
        .mockRejectedValueOnce(
          new Error("Network failure"),
        )
        .mockResolvedValueOnce(
          mockResponse({
            ok: true,
            status: 200,
          }),
        );

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 1,
        },
      );

      expect(
        global.fetch,
      ).toHaveBeenCalledTimes(2);

      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });

    test("returns 503 after network retries are exhausted", async () => {
      global.fetch.mockRejectedValue(
        new Error("Network failure"),
      );

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 1,
        },
      );

      expect(
        global.fetch,
      ).toHaveBeenCalledTimes(2);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(503);

      expect(result.data).toEqual({
        success: false,
        message:
          "Downstream service unavailable.",
        code: "DOWNSTREAM_UNAVAILABLE",
      });

      expect(result.error.type).toBe(
        "NETWORK_ERROR",
      );

      expect(result.attempts).toBe(2);
    });

    test("does not retry unsafe POST after network failure", async () => {
      global.fetch.mockRejectedValue(
        new Error("Network failure"),
      );

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "POST",
          retries: 3,
        },
      );

      expect(
        global.fetch,
      ).toHaveBeenCalledTimes(1);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(503);
      expect(result.error.type).toBe(
        "NETWORK_ERROR",
      );
    });
  });

  // -------------------------------------------------------
  // TIMEOUT
  // -------------------------------------------------------

  describe("timeout", () => {
    test("returns 504 when request times out", async () => {
      global.fetch.mockRejectedValue(
        Object.assign(
          new Error("The operation was aborted"),
          {
            name: "AbortError",
          },
        ),
      );

      const result = await request(
        BASE_URL,
        PATH,
        {
          method: "GET",
          retries: 0,
          timeoutMs: 10,
        },
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(504);

      expect(result.data).toEqual({
        success: false,
        message:
          "Downstream service request timed out.",
        code: "DOWNSTREAM_TIMEOUT",
      });

      expect(result.error.type).toBe(
        "TIMEOUT",
      );
    });
  });

  // -------------------------------------------------------
  // CIRCUIT BREAKER
  // -------------------------------------------------------

  describe("circuit breaker", () => {
    test("starts with CLOSED circuit", () => {
      const status = getCircuitStatus();

      expect(status).toBeDefined();
    });

    test("opens circuit after repeated server failures", async () => {
      global.fetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 500,
        }),
      );

      for (let i = 0; i < 5; i += 1) {
        await request(
          "http://circuit-test-service:5000",
          PATH,
          {
            method: "GET",
            retries: 0,
          },
        );
      }

      const status = getCircuitStatus();

      const circuit =
        status["http://circuit-test-service:5000"];

      expect(circuit).toBeDefined();
      expect(circuit.state).toBe("OPEN");
      expect(circuit.failures).toBe(5);
    });

    test("fails immediately when circuit is open", async () => {
      global.fetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 500,
        }),
      );

      const url =
        "http://open-circuit-test-service:5000";

      for (let i = 0; i < 5; i += 1) {
        await request(
          url,
          PATH,
          {
            method: "GET",
            retries: 0,
          },
        );
      }

      global.fetch.mockClear();

      const result = await request(
        url,
        PATH,
        {
          method: "GET",
          retries: 0,
        },
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(503);

      expect(result.data.code).toBe(
        "CIRCUIT_OPEN",
      );

      expect(
        global.fetch,
      ).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // SUCCESS RESETS CIRCUIT
  // -------------------------------------------------------

  describe("circuit recovery", () => {
    test("successful request resets failures", async () => {
      const url =
        "http://recovery-test-service:5000";

      global.fetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 500,
        }),
      );

      await request(
        url,
        PATH,
        {
          method: "GET",
          retries: 0,
        },
      );

      await request(
        url,
        PATH,
        {
          method: "GET",
          retries: 0,
        },
      );

      global.fetch.mockResolvedValue(
        mockResponse({
          ok: true,
          status: 200,
          data: {
            success: true,
          },
        }),
      );

      const result = await request(
        url,
        PATH,
        {
          method: "GET",
          retries: 0,
        },
      );

      expect(result.ok).toBe(true);

      const status = getCircuitStatus();

      expect(
        status[url].state,
      ).toBe("CLOSED");

      expect(
        status[url].failures,
      ).toBe(0);
    });
  });

  // -------------------------------------------------------
  // CONVENIENCE METHODS
  // -------------------------------------------------------

  describe("convenience methods", () => {
    test("getJson uses GET", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await getJson(
        BASE_URL,
        "/users",
      );

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/users`,
        expect.objectContaining({
          method: "GET",
        }),
      );
    });

    test("postJson uses POST and sends body", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await postJson(
        BASE_URL,
        "/orders",
        {
          productId: "p1",
        },
      );

      const options =
        global.fetch.mock.calls[0][1];

      expect(options.method).toBe("POST");

      expect(options.body).toBe(
        JSON.stringify({
          productId: "p1",
        }),
      );
    });

    test("putJson uses PUT and sends body", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await putJson(
        BASE_URL,
        "/users/1",
        {
          name: "Updated",
        },
      );

      const options =
        global.fetch.mock.calls[0][1];

      expect(options.method).toBe("PUT");

      expect(options.body).toBe(
        JSON.stringify({
          name: "Updated",
        }),
      );
    });

    test("patchJson uses PATCH and sends body", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await patchJson(
        BASE_URL,
        "/orders/1",
        {
          status: "DELIVERED",
        },
      );

      const options =
        global.fetch.mock.calls[0][1];

      expect(options.method).toBe("PATCH");

      expect(options.body).toBe(
        JSON.stringify({
          status: "DELIVERED",
        }),
      );
    });

    test("deleteJson uses DELETE", async () => {
      global.fetch.mockResolvedValue(
        mockResponse(),
      );

      await deleteJson(
        BASE_URL,
        "/orders/1",
      );

      const options =
        global.fetch.mock.calls[0][1];

      expect(options.method).toBe("DELETE");
    });
  });
});