const {
  request,
  getJson,
  postJson,
  putJson,
  patchJson,
  deleteJson,
  getCircuitStatus,
} = require("../../src/utils/serviceClient");

describe("Service Client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    process.env.INTERNAL_SERVICE_TOKEN = "internal-test-token";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  describe("request", () => {
    test("makes a successful GET request", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            success: true,
            data: { id: 1 },
          })
        ),
      });

      const result = await request(
        "http://example-service:5000",
        "/users/1",
        {
          method: "GET",
          retries: 0,
        }
      );

      expect(result).toEqual({
        ok: true,
        status: 200,
        data: {
          success: true,
          data: { id: 1 },
        },
        error: null,
        attempts: 1,
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test("builds URL without duplicate trailing slash", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request(
        "http://example-service:5000/",
        "/users",
        {
          method: "GET",
          retries: 0,
        }
      );

      expect(global.fetch.mock.calls[0][0]).toBe(
        "http://example-service:5000/users"
      );
    });

    test("adds internal service token when configured", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request(
        "http://example-service:5000",
        "/users",
        {
          method: "GET",
          retries: 0,
        }
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.headers["x-internal-service-token"]).toBe(
        "internal-test-token"
      );
    });

    test("does not overwrite existing internal service token", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request(
        "http://example-service:5000",
        "/users",
        {
          method: "GET",
          retries: 0,
          headers: {
            "x-internal-service-token": "caller-token",
          },
        }
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.headers["x-internal-service-token"]).toBe("caller-token");
    });

    test("adds request ID when one is not provided", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request(
        "http://request-id-service:5000",
        "/test",
        {
          method: "GET",
          retries: 0,
        }
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.headers["x-request-id"]).toBeDefined();
      expect(typeof options.headers["x-request-id"]).toBe("string");
    });

    test("preserves existing lowercase request ID", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request(
        "http://request-id-service:5000",
        "/test",
        {
          method: "GET",
          retries: 0,
          headers: {
            "x-request-id": "existing-request-id",
          },
        }
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.headers["x-request-id"]).toBe("existing-request-id");
    });

    test("preserves existing uppercase request ID", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request(
        "http://request-id-service:5000",
        "/test",
        {
          method: "GET",
          retries: 0,
          headers: {
            "X-Request-Id": "existing-uppercase-id",
          },
        }
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.headers["X-Request-Id"]).toBe(
        "existing-uppercase-id"
      );
      expect(options.headers["x-request-id"]).toBeUndefined();
    });

    test("serializes object body as JSON", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request(
        "http://example-service:5000",
        "/users",
        {
          method: "POST",
          body: {
            name: "Alice",
            role: "USER",
          },
          retries: 0,
        }
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.body).toBe(
        JSON.stringify({
          name: "Alice",
          role: "USER",
        })
      );

      expect(options.headers["content-type"]).toBe(
        "application/json"
      );
    });

    test("does not modify string body", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request(
        "http://example-service:5000",
        "/users",
        {
          method: "POST",
          body: '{"name":"Alice"}',
          retries: 0,
        }
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.body).toBe('{"name":"Alice"}');
    });

    test("returns null when response body is empty", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 204,
        text: jest.fn().mockResolvedValue(""),
      });

      const result = await request(
        "http://example-service:5000",
        "/users",
        {
          method: "GET",
          retries: 0,
        }
      );

      expect(result.data).toBeNull();
      expect(result.ok).toBe(true);
      expect(result.status).toBe(204);
    });

    test("handles invalid JSON response safely", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("not-valid-json"),
      });

      const result = await request(
        "http://example-service:5000",
        "/users",
        {
          method: "GET",
          retries: 0,
        }
      );

      expect(result.data).toEqual({
        success: false,
        message: "Invalid JSON response from downstream service.",
        raw: "not-valid-json",
      });
    });

    test("returns non-retryable 400 response without retrying", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            success: false,
            message: "Bad request",
          })
        ),
      });

      const result = await request(
        "http://example-service:5000",
        "/users",
        {
          method: "GET",
          retries: 3,
        }
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(result.attempts).toBe(1);
    });

    test("retries GET request on 500 response", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              message: "Server error",
            })
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              success: true,
            })
          ),
        });

      const result = await request(
        "http://retry-service:5000",
        "/test",
        {
          method: "GET",
          retries: 1,
          timeoutMs: 1000,
        }
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });

    test("does not retry POST automatically", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            message: "Server error",
          })
        ),
      });

      const result = await request(
        "http://write-service:5000",
        "/users",
        {
          method: "POST",
          retries: 3,
        }
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(500);
      expect(result.attempts).toBe(1);
    });

    test("retries POST when retrySafe is true", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              message: "Unavailable",
            })
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              success: true,
            })
          ),
        });

      const result = await request(
        "http://safe-write-service:5000",
        "/users",
        {
          method: "POST",
          retrySafe: true,
          retries: 1,
          timeoutMs: 1000,
        }
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      expect(result.status).toBe(201);
      expect(result.attempts).toBe(2);
    });

    test("returns 503 for network error after retries are exhausted", async () => {
      global.fetch.mockRejectedValue(new Error("Network failure"));

      const result = await request(
        "http://network-service:5000",
        "/test",
        {
          method: "GET",
          retries: 1,
          timeoutMs: 1000,
        }
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(503);
      expect(result.data.code).toBe("DOWNSTREAM_UNAVAILABLE");
      expect(result.error.type).toBe("NETWORK_ERROR");
      expect(result.error.message).toBe("Network failure");
      expect(result.attempts).toBe(2);
    });

    test("returns 504 for timeout error", async () => {
      const timeoutError = new Error("Request timed out");
      timeoutError.name = "AbortError";

      global.fetch.mockRejectedValue(timeoutError);

      const result = await request(
        "http://timeout-service:5000",
        "/test",
        {
          method: "GET",
          retries: 0,
          timeoutMs: 10,
        }
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(504);
      expect(result.data.code).toBe("DOWNSTREAM_TIMEOUT");
      expect(result.error.type).toBe("TIMEOUT");
      expect(result.attempts).toBe(1);
    });

    test("does not pass internal retry options to fetch", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request(
        "http://example-service:5000",
        "/test",
        {
          method: "GET",
          retries: 0,
          retrySafe: true,
          timeoutMs: 1000,
        }
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.retries).toBeUndefined();
      expect(options.retrySafe).toBeUndefined();
      expect(options.timeoutMs).toBeUndefined();
    });
  });

  describe("circuit breaker", () => {
    test("opens circuit after repeated server failures", async () => {
      const baseUrl = "http://circuit-test-service:5000";

      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            message: "Server error",
          })
        ),
      });

      for (let i = 0; i < 5; i++) {
        await request(baseUrl, "/test", {
          method: "GET",
          retries: 0,
        });
      }

      const status = getCircuitStatus();

      expect(status["http://circuit-test-service:5000"]).toBeDefined();
      expect(status["http://circuit-test-service:5000"].state).toBe(
        "OPEN"
      );
      expect(status["http://circuit-test-service:5000"].failures).toBe(5);
    });

    test("returns CIRCUIT_OPEN when circuit is open", async () => {
      const baseUrl = "http://open-circuit-service:5000";

      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            message: "Server error",
          })
        ),
      });

      for (let i = 0; i < 5; i++) {
        await request(baseUrl, "/test", {
          method: "GET",
          retries: 0,
        });
      }

      global.fetch.mockClear();

      const result = await request(baseUrl, "/test", {
        method: "GET",
        retries: 0,
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.status).toBe(503);
      expect(result.data.code).toBe("CIRCUIT_OPEN");
      expect(result.error.type).toBe("CIRCUIT_OPEN");
      expect(result.attempts).toBe(0);
    });

    test("successful request resets circuit breaker", async () => {
      const baseUrl = "http://reset-circuit-service:5000";

      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            message: "Server error",
          })
        ),
      });

      await request(baseUrl, "/test", {
        method: "GET",
        retries: 0,
      });

      await request(baseUrl, "/test", {
        method: "GET",
        retries: 0,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request(baseUrl, "/test", {
        method: "GET",
        retries: 0,
      });

      const status = getCircuitStatus();

      expect(status["http://reset-circuit-service:5000"].state).toBe(
        "CLOSED"
      );
      expect(status["http://reset-circuit-service:5000"].failures).toBe(0);
      expect(status["http://reset-circuit-service:5000"].openedAt).toBeNull();
    });
  });

  describe("HTTP convenience methods", () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });
    });

    test("getJson uses GET method", async () => {
      await getJson(
        "http://example-service:5000",
        "/users",
        {},
        { retries: 0 }
      );

      expect(global.fetch.mock.calls[0][1].method).toBe("GET");
    });

    test("postJson uses POST method and sends body", async () => {
      await postJson(
        "http://example-service:5000",
        "/users",
        { name: "Alice" },
        {},
        { retries: 0 }
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.method).toBe("POST");
      expect(options.body).toBe(
        JSON.stringify({ name: "Alice" })
      );
    });

    test("putJson uses PUT method and sends body", async () => {
      await putJson(
        "http://example-service:5000",
        "/users/1",
        { name: "Updated" },
        {},
        { retries: 0 }
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.method).toBe("PUT");
      expect(options.body).toBe(
        JSON.stringify({ name: "Updated" })
      );
    });

    test("patchJson uses PATCH method and sends body", async () => {
      await patchJson(
        "http://example-service:5000",
        "/users/1",
        { name: "Patched" },
        {},
        { retries: 0 }
      );

      const options = global.fetch.mock.calls[0][1];

      expect(options.method).toBe("PATCH");
      expect(options.body).toBe(
        JSON.stringify({ name: "Patched" })
      );
    });

    test("deleteJson uses DELETE method", async () => {
      await deleteJson(
        "http://example-service:5000",
        "/users/1",
        {},
        { retries: 0 }
      );

      expect(global.fetch.mock.calls[0][1].method).toBe("DELETE");
    });
  });
});