describe("serviceClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();

    process.env = {
      ...originalEnv,
      SERVICE_REQUEST_TIMEOUT_MS: "100",
      SERVICE_REQUEST_RETRIES: "2",
      SERVICE_RETRY_DELAY_MS: "0",
      CIRCUIT_BREAKER_FAILURE_THRESHOLD: "5",
      CIRCUIT_BREAKER_RESET_TIMEOUT_MS: "30000",
    };

    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function loadClient() {
    return require("../../src/utils/serviceClient");
  }

  function response({
    ok = true,
    status = 200,
    body = { success: true },
  } = {}) {
    return {
      ok,
      status,
      text: jest
        .fn()
        .mockResolvedValue(body === null ? "" : JSON.stringify(body)),
    };
  }

  describe("basic requests", () => {
    test("performs GET request", async () => {
      global.fetch.mockResolvedValue(
        response({
          ok: true,
          status: 200,
          body: { id: 1 },
        }),
      );

      const { request } = loadClient();

      const result = await request("http://service-1:5000", "/users");

      expect(result).toEqual({
        ok: true,
        status: 200,
        data: { id: 1 },
        error: null,
        attempts: 1,
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("http://service-1:5000/users");
      expect(options.method).toBe("GET");
      expect(options.headers["x-request-id"]).toEqual(expect.any(String));
      expect(options.signal).toBeDefined();
    });

    test("removes trailing slash from base URL", async () => {
      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      await request("http://service-2:5000/", "/health");

      expect(global.fetch.mock.calls[0][0]).toBe(
        "http://service-2:5000/health",
      );
    });

    test("preserves supplied request ID", async () => {
      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      await request("http://service-3:5000", "/test", {
        headers: {
          "x-request-id": "request-123",
        },
      });

      const options = global.fetch.mock.calls[0][1];

      expect(options.headers["x-request-id"]).toBe("request-123");
    });

    test("preserves capitalized request ID", async () => {
      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      await request("http://service-4:5000", "/test", {
        headers: {
          "X-Request-Id": "request-456",
        },
      });

      const options = global.fetch.mock.calls[0][1];

      expect(options.headers["X-Request-Id"]).toBe("request-456");
      expect(options.headers["x-request-id"]).toBeUndefined();
    });

    test("adds internal service token when configured", async () => {
      process.env.INTERNAL_SERVICE_TOKEN = "internal-secret";

      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      await request("http://service-5:5000", "/test");

      const options = global.fetch.mock.calls[0][1];

      expect(options.headers["x-internal-service-token"]).toBe(
        "internal-secret",
      );
    });

    test("does not overwrite caller internal service token", async () => {
      process.env.INTERNAL_SERVICE_TOKEN = "internal-secret";

      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      await request("http://service-6:5000", "/test", {
        headers: {
          "x-internal-service-token": "caller-token",
        },
      });

      const options = global.fetch.mock.calls[0][1];

      expect(options.headers["x-internal-service-token"]).toBe("caller-token");
    });

    test("serializes object body", async () => {
      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      await request("http://service-7:5000", "/users", {
        method: "POST",
        body: {
          name: "Alice",
        },
      });

      const options = global.fetch.mock.calls[0][1];

      expect(options.body).toBe(JSON.stringify({ name: "Alice" }));
      expect(options.headers["content-type"]).toBe("application/json");
    });

    test("preserves supplied content type", async () => {
      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      await request("http://service-8:5000", "/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/custom+json",
        },
        body: {
          name: "Alice",
        },
      });

      const options = global.fetch.mock.calls[0][1];

      expect(options.headers["Content-Type"]).toBe("application/custom+json");

      expect(options.headers["content-type"]).toBe("application/custom+json");
    });

    test("does not serialize string body", async () => {
      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      await request("http://service-9:5000", "/test", {
        method: "POST",
        body: "already encoded",
      });

      expect(global.fetch.mock.calls[0][1].body).toBe("already encoded");
    });

    test("does not serialize null body", async () => {
      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      await request("http://service-10:5000", "/test", {
        method: "POST",
        body: null,
      });

      expect(global.fetch.mock.calls[0][1].body).toBeNull();
    });

    test("does not serialize Buffer body", async () => {
      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      const buffer = Buffer.from("hello");

      await request("http://service-11:5000", "/test", {
        method: "POST",
        body: buffer,
      });

      expect(global.fetch.mock.calls[0][1].body).toBe(buffer);
    });
  });

  describe("response parsing", () => {
    test("returns null for empty response body", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 204,
        text: jest.fn().mockResolvedValue(""),
      });

      const { request } = loadClient();

      const result = await request("http://service-12:5000", "/empty");

      expect(result.data).toBeNull();
    });

    test("returns safe error object for invalid JSON", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("not-json"),
      });

      const { request } = loadClient();

      const result = await request("http://service-13:5000", "/test");

      expect(result.data).toEqual({
        success: false,
        message: "Invalid JSON response from downstream service.",
        raw: "not-json",
      });
    });

    test("truncates extremely long invalid JSON", async () => {
      const invalidBody = "x".repeat(2000);

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(invalidBody),
      });

      const { request } = loadClient();

      const result = await request("http://service-14:5000", "/test");

      expect(result.data.raw).toHaveLength(1000);
    });
  });

  describe("HTTP errors", () => {
    test("returns 4xx error without retrying", async () => {
      global.fetch.mockResolvedValue(
        response({
          ok: false,
          status: 400,
          body: {
            success: false,
            message: "Bad request",
          },
        }),
      );

      const { request } = loadClient();

      const result = await request("http://service-15:5000", "/test", {
        retries: 2,
      });

      expect(result).toEqual({
        ok: false,
        status: 400,
        data: {
          success: false,
          message: "Bad request",
        },
        error: null,
        attempts: 1,
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test("does not automatically retry unsafe POST", async () => {
      global.fetch.mockResolvedValue(
        response({
          ok: false,
          status: 503,
        }),
      );

      const { request } = loadClient();

      const result = await request("http://service-16:5000", "/test", {
        method: "POST",
        retries: 2,
      });

      expect(result.status).toBe(503);
      expect(result.attempts).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test("retries safe GET on temporary 503", async () => {
      global.fetch
        .mockResolvedValueOnce(
          response({
            ok: false,
            status: 503,
          }),
        )
        .mockResolvedValueOnce(
          response({
            ok: true,
            status: 200,
            body: { recovered: true },
          }),
        );

      const { request } = loadClient();

      const result = await request("http://service-17:5000", "/test", {
        retries: 2,
      });

      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test("retries unsafe request when retrySafe is true", async () => {
      global.fetch
        .mockResolvedValueOnce(
          response({
            ok: false,
            status: 503,
          }),
        )
        .mockResolvedValueOnce(response());

      const { request } = loadClient();

      const result = await request("http://service-18:5000", "/test", {
        method: "POST",
        retrySafe: true,
        retries: 1,
      });

      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });

    test("stops after maximum retries", async () => {
      global.fetch.mockResolvedValue(
        response({
          ok: false,
          status: 503,
        }),
      );

      const { request } = loadClient();

      const result = await request("http://service-19:5000", "/test", {
        retries: 2,
      });

      expect(result.ok).toBe(false);
      expect(result.attempts).toBe(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test("retries 429 response", async () => {
      global.fetch
        .mockResolvedValueOnce(
          response({
            ok: false,
            status: 429,
          }),
        )
        .mockResolvedValueOnce(response());

      const { request } = loadClient();

      const result = await request("http://service-20:5000", "/test", {
        retries: 1,
      });

      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });
  });

  describe("network errors", () => {
    test("returns 503 for network failure", async () => {
      global.fetch.mockRejectedValue(new Error("ECONNREFUSED"));

      const { request } = loadClient();

      const result = await request("http://service-21:5000", "/test", {
        retries: 0,
      });

      expect(result).toEqual({
        ok: false,
        status: 503,
        data: {
          success: false,
          message: "Downstream service unavailable.",
          code: "DOWNSTREAM_UNAVAILABLE",
        },
        error: {
          type: "NETWORK_ERROR",
          message: "ECONNREFUSED",
        },
        attempts: 1,
      });
    });

    test("retries network failure for safe method", async () => {
      global.fetch
        .mockRejectedValueOnce(new Error("network failure"))
        .mockResolvedValueOnce(response());

      const { request } = loadClient();

      const result = await request("http://service-22:5000", "/test", {
        retries: 1,
      });

      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });

    test("does not retry network failure for unsafe method", async () => {
      global.fetch.mockRejectedValue(new Error("network failure"));

      const { request } = loadClient();

      const result = await request("http://service-23:5000", "/test", {
        method: "POST",
        retries: 2,
      });

      expect(result.status).toBe(503);
      expect(result.attempts).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test("retries network failure for unsafe method when retrySafe is true", async () => {
      global.fetch
        .mockRejectedValueOnce(new Error("network failure"))
        .mockResolvedValueOnce(response());

      const { request } = loadClient();

      const result = await request("http://service-24:5000", "/test", {
        method: "POST",
        retrySafe: true,
        retries: 1,
      });

      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });

    test("returns 504 for AbortError", async () => {
      const error = new Error("request aborted");
      error.name = "AbortError";

      global.fetch.mockRejectedValue(error);

      const { request } = loadClient();

      const result = await request("http://service-25:5000", "/test", {
        retries: 0,
      });

      expect(result).toEqual({
        ok: false,
        status: 504,
        data: {
          success: false,
          message: "Downstream service request timed out.",
          code: "DOWNSTREAM_TIMEOUT",
        },
        error: {
          type: "TIMEOUT",
          message: "request aborted",
        },
        attempts: 1,
      });
    });
  });

  describe("convenience methods", () => {
    test("getJson uses GET", async () => {
      global.fetch.mockResolvedValue(response());

      const { getJson } = loadClient();

      await getJson("http://service-26:5000", "/users");

      expect(global.fetch.mock.calls[0][1].method).toBe("GET");
    });

    test("postJson uses POST and body", async () => {
      global.fetch.mockResolvedValue(response());

      const { postJson } = loadClient();

      await postJson("http://service-27:5000", "/users", { name: "Alice" });

      const options = global.fetch.mock.calls[0][1];

      expect(options.method).toBe("POST");
      expect(options.body).toBe(JSON.stringify({ name: "Alice" }));
    });

    test("putJson uses PUT", async () => {
      global.fetch.mockResolvedValue(response());

      const { putJson } = loadClient();

      await putJson("http://service-28:5000", "/users/1", {
        name: "Alice",
      });

      expect(global.fetch.mock.calls[0][1].method).toBe("PUT");
    });

    test("patchJson uses PATCH", async () => {
      global.fetch.mockResolvedValue(response());

      const { patchJson } = loadClient();

      await patchJson("http://service-29:5000", "/users/1", {
        name: "Alice",
      });

      expect(global.fetch.mock.calls[0][1].method).toBe("PATCH");
    });

    test("deleteJson uses DELETE", async () => {
      global.fetch.mockResolvedValue(response());

      const { deleteJson } = loadClient();

      await deleteJson("http://service-30:5000", "/users/1");

      expect(global.fetch.mock.calls[0][1].method).toBe("DELETE");
    });
  });

  describe("circuit breaker", () => {
    test("opens after failure threshold", async () => {
      global.fetch.mockResolvedValue(
        response({
          ok: false,
          status: 500,
        }),
      );

      const { request } = loadClient();

      const baseUrl = "http://circuit-open:5000";

      for (let i = 0; i < 5; i += 1) {
        await request(baseUrl, "/test", {
          retries: 0,
        });
      }

      const result = await request(baseUrl, "/test", {
        retries: 0,
      });

      expect(result).toEqual({
        ok: false,
        status: 503,
        data: {
          success: false,
          message:
            "Downstream service temporarily unavailable. Circuit breaker is open.",
          code: "CIRCUIT_OPEN",
        },
        error: {
          type: "CIRCUIT_OPEN",
          message: "Circuit breaker is open for downstream service.",
        },
        attempts: 0,
      });

      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    test("does not open circuit for 4xx failures", async () => {
      global.fetch.mockResolvedValue(
        response({
          ok: false,
          status: 400,
        }),
      );

      const { request, getCircuitStatus } = loadClient();

      const baseUrl = "http://circuit-4xx:5000";

      for (let i = 0; i < 10; i += 1) {
        await request(baseUrl, "/test", {
          retries: 0,
        });
      }

      const status = getCircuitStatus()[baseUrl];

      expect(status.state).toBe("CLOSED");
      expect(status.failures).toBe(0);
    });

    test("reports circuit diagnostics", async () => {
      global.fetch.mockResolvedValue(
        response({
          ok: false,
          status: 500,
        }),
      );

      const { request, getCircuitStatus } = loadClient();

      const baseUrl = "http://diagnostics:5000";

      await request(baseUrl, "/test", {
        retries: 0,
      });

      const status = getCircuitStatus();

      expect(status[baseUrl]).toEqual(
        expect.objectContaining({
          state: "CLOSED",
          failures: 1,
        }),
      );

      expect(status[baseUrl]).toHaveProperty("openedAt");
    });

    test("moves OPEN circuit to HALF_OPEN after reset timeout", async () => {
      global.fetch.mockResolvedValue(
        response({
          ok: false,
          status: 500,
        }),
      );

      const { request, getCircuitStatus } = loadClient();

      const baseUrl = "http://half-open:5000";

      for (let i = 0; i < 5; i += 1) {
        await request(baseUrl, "/test", {
          retries: 0,
        });
      }

      const opened = getCircuitStatus()[baseUrl];

      expect(opened.state).toBe("OPEN");

      const openedAt = opened.openedAt;

      jest.spyOn(Date, "now").mockReturnValue(openedAt + 30001);

      global.fetch.mockResolvedValueOnce(response());

      const result = await request(baseUrl, "/test", {
        retries: 0,
      });

      expect(result.ok).toBe(true);

      expect(getCircuitStatus()[baseUrl].state).toBe("CLOSED");
    });

    test("allows only one HALF_OPEN request", async () => {
      global.fetch.mockResolvedValue(
        response({
          ok: false,
          status: 500,
        }),
      );

      const { request, getCircuitStatus } = loadClient();

      const baseUrl = "http://half-open-limit:5000";

      for (let i = 0; i < 5; i += 1) {
        await request(baseUrl, "/test", {
          retries: 0,
        });
      }

      const openedAt = getCircuitStatus()[baseUrl].openedAt;

      jest.spyOn(Date, "now").mockReturnValue(openedAt + 30001);

      global.fetch.mockResolvedValueOnce(
        response({
          ok: false,
          status: 500,
        }),
      );

      const first = await request(baseUrl, "/test", {
        retries: 0,
      });

      expect(first.status).toBe(500);

      const second = await request(baseUrl, "/test", {
        retries: 0,
      });

      expect(second.status).toBe(503);
      expect(second.data.code).toBe("CIRCUIT_OPEN");
    });

    test("reopens circuit when HALF_OPEN request fails", async () => {
      global.fetch.mockResolvedValue(
        response({
          ok: false,
          status: 500,
        }),
      );

      const { request, getCircuitStatus } = loadClient();

      const baseUrl = "http://half-open-failure:5000";

      for (let i = 0; i < 5; i += 1) {
        await request(baseUrl, "/test", {
          retries: 0,
        });
      }

      const openedAt = getCircuitStatus()[baseUrl].openedAt;

      jest.spyOn(Date, "now").mockReturnValue(openedAt + 30001);

      await request(baseUrl, "/test", {
        retries: 0,
      });

      expect(getCircuitStatus()[baseUrl].state).toBe("OPEN");
    });
  });

  describe("edge cases", () => {
    test("supports HEAD method", async () => {
      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      await request("http://service-31:5000", "/test", {
        method: "HEAD",
      });

      expect(global.fetch.mock.calls[0][1].method).toBe("HEAD");
    });

    test("supports OPTIONS method", async () => {
      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      await request("http://service-32:5000", "/test", {
        method: "OPTIONS",
      });

      expect(global.fetch.mock.calls[0][1].method).toBe("OPTIONS");
    });

    test("handles malformed base URL for circuit key", async () => {
      global.fetch.mockResolvedValue(response());

      const { request, getCircuitStatus } = loadClient();

      const baseUrl = "not-a-valid-url";

      await request(baseUrl, "/test");

      expect(getCircuitStatus()[baseUrl]).toBeDefined();
    });

    test("normalizes method to uppercase", async () => {
      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      await request("http://service-33:5000", "/test", {
        method: "post",
      });

      expect(global.fetch.mock.calls[0][1].method).toBe("POST");
    });

    test("forces at least one attempt when retries is negative", async () => {
      global.fetch.mockResolvedValue(response());

      const { request } = loadClient();

      const result = await request("http://service-34:5000", "/test", {
        retries: -10,
      });

      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
