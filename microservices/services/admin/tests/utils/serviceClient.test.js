describe("serviceClient", () => {
  let serviceClient;
  let request;
  let getJson;
  let postJson;
  let putJson;
  let patchJson;
  let deleteJson;
  let getCircuitStatus;

  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();

    process.env = {
      ...originalEnv,

      // Make tests fast and deterministic.
      SERVICE_REQUEST_TIMEOUT_MS: "1000",
      SERVICE_REQUEST_RETRIES: "2",
      SERVICE_RETRY_DELAY_MS: "0",

      // Circuit breaker configuration.
      SERVICE_CIRCUIT_FAILURE_THRESHOLD: "5",
      SERVICE_CIRCUIT_RESET_MS: "30000",

      // Internal service authentication.
      INTERNAL_SERVICE_TOKEN: "test-internal-token",

      // If your implementation uses another env name for the token,
      // change it here.
    };

    global.fetch = jest.fn();

    serviceClient = require("../../src/utils/serviceClient");

    ({
      request,
      getJson,
      postJson,
      putJson,
      patchJson,
      deleteJson,
      getCircuitStatus,
    } = serviceClient);

    // Make retry jitter deterministic if the implementation uses Math.random().
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  describe("successful requests", () => {
    test("returns successful JSON response", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              id: "123",
              name: "Test Vendor",
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const result = await request("http://localhost:5000", "/api/vendors");

      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          status: 200,
          data: {
            success: true,
            data: {
              id: "123",
              name: "Test Vendor",
            },
          },
          attempts: 1,
        }),
      );

      expect(result.error).toBeNull();
    });

    test("uses GET as the default method", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await request("http://localhost:5000", "/api/vendors");

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("http://localhost:5000/api/vendors");
      expect(options.method).toBe("GET");
    });

    test("supports a full URL/path combination correctly", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await request("http://localhost:5000/", "/api/test");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/test",
        expect.any(Object),
      );
    });

    test("returns attempts equal to one on the first successful request", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      const result = await request("http://localhost:5000", "/test");

      expect(result.attempts).toBe(1);
    });
  });

  describe("request headers", () => {
    test("adds x-request-id header", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await request("http://localhost:5000", "/test");

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers["x-request-id"]).toBeDefined();
      expect(typeof options.headers["x-request-id"]).toBe("string");
      expect(options.headers["x-request-id"].length).toBeGreaterThan(0);
    });

    test("adds internal service token", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await request("http://localhost:5000", "/test");

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers).toEqual(
        expect.objectContaining({
          "x-internal-service-token": "test-internal-token",
        }),
      );
    });

    test("preserves caller-provided headers", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await request("http://localhost:5000", "/test", {
        headers: {
          "x-custom-header": "custom-value",
        },
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers["x-custom-header"]).toBe("custom-value");
    });

    test("caller headers can provide authorization", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await request("http://localhost:5000", "/test", {
        headers: {
          authorization: "Bearer user-token",
        },
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers.authorization).toBe("Bearer user-token");
    });

    test("does not mutate the caller headers object", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      const headers = {
        "x-custom-header": "value",
      };

      await request("http://localhost:5000", "/test", {
        headers,
      });

      expect(headers).toEqual({
        "x-custom-header": "value",
      });
    });
  });

  describe("request body", () => {
    test("stringifies an object request body", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      const body = {
        name: "Test Vendor",
        status: "VERIFIED",
      };

      await request("http://localhost:5000", "/api/vendors/123", {
        method: "PATCH",
        body,
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.body).toBe(JSON.stringify(body));
    });

    test("adds content-type application/json for object body", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await request("http://localhost:5000", "/api/vendors/123", {
        method: "PATCH",
        body: {
          status: "VERIFIED",
        },
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers["content-type"]).toBe("application/json");
    });

    test("preserves a string body", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await request("http://localhost:5000", "/test", {
        method: "POST",
        body: '{"hello":"world"}',
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.body).toBe('{"hello":"world"}');
    });

    test("supports null body", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await request("http://localhost:5000", "/test", {
        method: "POST",
        body: null,
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.body).toBeFalsy();
    });
  });

  describe("response parsing", () => {
    test("parses valid JSON response", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "Success",
            data: {
              id: 1,
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const result = await request("http://localhost:5000", "/test");

      expect(result.data).toEqual({
        message: "Success",
        data: {
          id: 1,
        },
      });
    });

    test("handles empty response body", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(null, {
          status: 204,
        }),
      );

      const result = await request("http://localhost:5000", "/test");

      expect(result.ok).toBe(true);
      expect(result.status).toBe(204);
    });

    test("handles non-JSON response safely", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response("plain text response", {
          status: 200,
          headers: {
            "content-type": "text/plain",
          },
        }),
      );

      const result = await request("http://localhost:5000", "/test");

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
    });

    test("returns failed HTTP response as ok false", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            message: "Vendor not found",
          }),
          {
            status: 404,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const result = await request("http://localhost:5000", "/test");

      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
      expect(result.data).toEqual({
        success: false,
        message: "Vendor not found",
      });
    });
  });

  describe("HTTP retries", () => {
    test("retries GET on 500", async () => {
      global.fetch
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              message: "Internal server error",
            }),
            {
              status: 500,
              headers: {
                "content-type": "application/json",
              },
            },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              message: "Success",
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            },
          ),
        );

      const result = await request("http://localhost:5000", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.attempts).toBe(2);
    });

    test("retries GET on 502", async () => {
      global.fetch
        .mockResolvedValueOnce(
          new Response("Bad gateway", {
            status: 502,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          }),
        );

      const result = await request("http://localhost:5000", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });

    test("retries GET on 503", async () => {
      global.fetch
        .mockResolvedValueOnce(
          new Response("Service unavailable", {
            status: 503,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          }),
        );

      const result = await request("http://localhost:5000", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });

    test("retries GET on 504", async () => {
      global.fetch
        .mockResolvedValueOnce(
          new Response("Gateway timeout", {
            status: 504,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          }),
        );

      const result = await request("http://localhost:5000", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
    });

    test("retries GET on 408", async () => {
      global.fetch
        .mockResolvedValueOnce(
          new Response("Request timeout", {
            status: 408,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          }),
        );

      const result = await request("http://localhost:5000", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
    });

    test("retries GET on 429", async () => {
      global.fetch
        .mockResolvedValueOnce(
          new Response("Too many requests", {
            status: 429,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          }),
        );

      const result = await request("http://localhost:5000", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
    });

    test("stops after configured retry count", async () => {
      global.fetch
        .mockResolvedValueOnce(
          new Response("Server error", {
            status: 500,
          }),
        )
        .mockResolvedValueOnce(
          new Response("Server error", {
            status: 500,
          }),
        )
        .mockResolvedValueOnce(
          new Response("Server error", {
            status: 500,
          }),
        );

      const result = await request("http://localhost:5000", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(3);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(500);
      expect(result.attempts).toBe(3);
    });

    test("does not retry a non-retryable 400 response", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "Bad request",
          }),
          {
            status: 400,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const result = await request("http://localhost:5000", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(result.attempts).toBe(1);
    });

    test("does not retry a non-retryable 401 response", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "Unauthorized",
          }),
          {
            status: 401,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const result = await request("http://localhost:5000", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });

    test("does not retry a non-retryable 404 response", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "Not found",
          }),
          {
            status: 404,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const result = await request("http://localhost:5000", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
    });
  });

  describe("unsafe HTTP method retries", () => {
    test("does not retry PATCH on 500 by default", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "Internal server error",
          }),
          {
            status: 500,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const result = await request(
        "http://localhost:5000",
        "/api/vendors/123",
        {
          method: "PATCH",
          body: {
            status: "VERIFIED",
          },
        },
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(500);
      expect(result.attempts).toBe(1);
    });

    test("does not retry POST on 500 by default", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response("Server error", {
          status: 500,
        }),
      );

      const result = await request("http://localhost:5000", "/api/test", {
        method: "POST",
        body: {
          name: "test",
        },
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      expect(result.attempts).toBe(1);
    });

    test("does not retry PUT on 500 by default", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response("Server error", {
          status: 500,
        }),
      );

      const result = await request("http://localhost:5000", "/api/test", {
        method: "PUT",
        body: {
          name: "test",
        },
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      expect(result.attempts).toBe(1);
    });

    test("does not retry DELETE on 500 by default", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response("Server error", {
          status: 500,
        }),
      );

      const result = await request("http://localhost:5000", "/api/test", {
        method: "DELETE",
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      expect(result.attempts).toBe(1);
    });

    test("retries PATCH when retrySafe is true", async () => {
      global.fetch
        .mockResolvedValueOnce(
          new Response("Server error", {
            status: 500,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          }),
        );

      const result = await request(
        "http://localhost:5000",
        "/api/vendors/123",
        {
          method: "PATCH",
          retrySafe: true,
          body: {
            status: "VERIFIED",
          },
        },
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });

    test("retries POST when retrySafe is true", async () => {
      global.fetch
        .mockResolvedValueOnce(
          new Response("Server error", {
            status: 500,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          }),
        );

      const result = await request("http://localhost:5000", "/api/test", {
        method: "POST",
        retrySafe: true,
        body: {
          name: "test",
        },
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });
  });

  describe("network errors", () => {
    test("retries GET after a network error", async () => {
      global.fetch
        .mockRejectedValueOnce(new Error("ECONNRESET"))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          }),
        );

      const result = await request("http://localhost:5000", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });

    test("returns failed result after network errors are exhausted", async () => {
      global.fetch
        .mockRejectedValueOnce(new Error("ECONNRESET"))
        .mockRejectedValueOnce(new Error("ECONNRESET"))
        .mockRejectedValueOnce(new Error("ECONNRESET"));

      const result = await request("http://localhost:5000", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(3);

      expect(result.ok).toBe(false);
      expect(result.attempts).toBe(3);
      expect(result.error).toBeDefined();
    });

    test("does not retry POST after network error by default", async () => {
      global.fetch.mockRejectedValueOnce(new Error("ECONNRESET"));

      const result = await request("http://localhost:5000", "/test", {
        method: "POST",
        body: {
          test: true,
        },
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      expect(result.attempts).toBe(1);
    });

    test("retries POST after network error when retrySafe is true", async () => {
      global.fetch
        .mockRejectedValueOnce(new Error("ECONNRESET"))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          }),
        );

      const result = await request("http://localhost:5000", "/test", {
        method: "POST",
        retrySafe: true,
        body: {
          test: true,
        },
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });
  });

  describe("timeout handling", () => {
    test("returns failure when fetch aborts due to timeout", async () => {
      const timeoutError = new Error("The operation was aborted");

      timeoutError.name = "AbortError";

      global.fetch.mockRejectedValue(timeoutError);

      const result = await request("http://localhost:5000", "/test");

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.attempts).toBeGreaterThanOrEqual(1);
    });

    test("passes AbortSignal to fetch", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await request("http://localhost:5000", "/test");

      const [, options] = global.fetch.mock.calls[0];

      expect(options.signal).toBeDefined();
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe("circuit breaker", () => {
    test("returns an empty circuit map for an unused service", () => {
      const status = getCircuitStatus();

      expect(status).toEqual({});
    });

    test("creates circuit state after a service failure", async () => {
      const baseUrl = "http://failure-count.local";

      global.fetch.mockResolvedValueOnce(
        new Response("Server error", {
          status: 500,
        }),
      );

      const result = await request(baseUrl, "/test", {
        retries: 0,
      });

      expect(result.ok).toBe(false);

      const status = getCircuitStatus();

      expect(Object.prototype.hasOwnProperty.call(status, baseUrl)).toBe(true);

      expect(status[baseUrl]).toEqual(
        expect.objectContaining({
          failures: 1,
          state: "CLOSED",
          openedAt: null,
        }),
      );
    });

    test("opens circuit after configured number of failures", async () => {
      const baseUrl = "http://circuit-test.local";

      for (let i = 0; i < 5; i += 1) {
        global.fetch.mockResolvedValueOnce(
          new Response("Server error", {
            status: 500,
          }),
        );

        const result = await request(baseUrl, `/failure-${i}`, {
          retries: 0,
        });

        expect(result.ok).toBe(false);
      }

      const status = getCircuitStatus();

      expect(Object.prototype.hasOwnProperty.call(status, baseUrl)).toBe(true);

      expect(status[baseUrl]).toEqual(
        expect.objectContaining({
          failures: 5,
          state: "OPEN",
        }),
      );

      expect(status[baseUrl].openedAt).not.toBeNull();
    });

    test("does not call fetch when circuit is open", async () => {
      const baseUrl = "http://open-circuit.local";

      // Open circuit.
      for (let i = 0; i < 5; i += 1) {
        global.fetch.mockResolvedValueOnce(
          new Response("Server error", {
            status: 500,
          }),
        );

        await request(baseUrl, `/failure-${i}`, {
          retries: 0,
        });
      }

      global.fetch.mockClear();

      const result = await request(baseUrl, "/should-not-call");

      expect(global.fetch).not.toHaveBeenCalled();

      expect(result.ok).toBe(false);
    });

    test("different origins have independent circuit states", async () => {
      const serviceA = "http://service-a.local";
      const serviceB = "http://service-b.local";

      for (let i = 0; i < 5; i += 1) {
        global.fetch.mockResolvedValueOnce(
          new Response("Server error", {
            status: 500,
          }),
        );

        await request(serviceA, `/failure-${i}`, {
          retries: 0,
        });
      }

      const status = getCircuitStatus();

      expect(status[serviceA]).toEqual(
        expect.objectContaining({
          failures: 5,
          state: "OPEN",
        }),
      );

      expect(status[serviceB]).toBeUndefined();
    });

    test("successful request resets circuit failures", async () => {
      const baseUrl = "http://reset-circuit.local";

      global.fetch.mockResolvedValueOnce(
        new Response("Server error", {
          status: 500,
        }),
      );

      await request(baseUrl, "/failure", {
        retries: 0,
      });

      let status = getCircuitStatus();

      expect(status[baseUrl].failures).toBe(1);
      expect(status[baseUrl].state).toBe("CLOSED");

      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const result = await request(baseUrl, "/success");

      expect(result.ok).toBe(true);

      status = getCircuitStatus();

      expect(status[baseUrl]).toEqual(
        expect.objectContaining({
          failures: 0,
          state: "CLOSED",
          openedAt: null,
        }),
      );
    });

    test("circuit can recover after reset period", async () => {
      jest.useFakeTimers();

      const baseUrl = "http://recoverable-circuit.local";

      try {
        // Open circuit.
        for (let i = 0; i < 5; i += 1) {
          global.fetch.mockResolvedValueOnce(
            new Response("Server error", {
              status: 500,
            }),
          );

          await request(baseUrl, `/failure-${i}`, {
            retries: 0,
          });
        }

        let status = getCircuitStatus();

        expect(status[baseUrl].state).toBe("OPEN");

        global.fetch.mockClear();

        // Advance past SERVICE_CIRCUIT_RESET_MS.
        jest.advanceTimersByTime(30001);

        global.fetch.mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              success: true,
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            },
          ),
        );

        const result = await request(baseUrl, "/after-reset");

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(result.ok).toBe(true);

        status = getCircuitStatus();

        expect(status[baseUrl].state).toBe("CLOSED");
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe("getJson", () => {
    test("performs GET request", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: ["one", "two"],
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const result = await getJson("http://localhost:5000", "/api/items");

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("http://localhost:5000/api/items");

      expect(options.method).toBe("GET");

      expect(result.ok).toBe(true);
      expect(result.data).toEqual({
        success: true,
        data: ["one", "two"],
      });
    });

    test("passes headers to GET request", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await getJson("http://localhost:5000", "/api/items", {
        authorization: "Bearer user-token",
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers.authorization).toBe("Bearer user-token");
    });

    test("passes request options to GET", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await getJson(
        "http://localhost:5000",
        "/api/items",
        {},
        {
          retrySafe: true,
        },
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("postJson", () => {
    test("performs POST with JSON body", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            id: "123",
          }),
          {
            status: 201,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const body = {
        name: "Test",
      };

      const result = await postJson(
        "http://localhost:5000",
        "/api/items",
        body,
      );

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("http://localhost:5000/api/items");

      expect(options.method).toBe("POST");
      expect(options.body).toBe(JSON.stringify(body));

      expect(result.ok).toBe(true);
      expect(result.status).toBe(201);
    });
  });

  describe("putJson", () => {
    test("performs PUT with JSON body", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const body = {
        name: "Updated",
      };

      const result = await putJson(
        "http://localhost:5000",
        "/api/items/123",
        body,
      );

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("http://localhost:5000/api/items/123");

      expect(options.method).toBe("PUT");
      expect(options.body).toBe(JSON.stringify(body));

      expect(result.ok).toBe(true);
    });
  });

  describe("patchJson", () => {
    test("performs PATCH with JSON body", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const body = {
        status: "VERIFIED",
      };

      const result = await patchJson(
        "http://localhost:5000",
        "/api/vendors/123",
        body,
      );

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("http://localhost:5000/api/vendors/123");

      expect(options.method).toBe("PATCH");
      expect(options.body).toBe(JSON.stringify(body));

      expect(result.ok).toBe(true);
    });

    test("does not retry PATCH unless retrySafe is enabled", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response("Server error", {
          status: 500,
        }),
      );

      const result = await patchJson(
        "http://localhost:5000",
        "/api/vendors/123",
        {
          status: "VERIFIED",
        },
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
    });
  });

  describe("deleteJson", () => {
    test("performs DELETE request", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      const result = await deleteJson(
        "http://localhost:5000",
        "/api/items/123",
      );

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("http://localhost:5000/api/items/123");

      expect(options.method).toBe("DELETE");

      expect(result.ok).toBe(true);
    });

    test("does not retry DELETE by default", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response("Server error", {
          status: 500,
        }),
      );

      const result = await deleteJson(
        "http://localhost:5000",
        "/api/items/123",
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
    });
  });

  describe("custom request options", () => {
    test("supports custom retry count", async () => {
      global.fetch
        .mockResolvedValueOnce(
          new Response("Server error", {
            status: 500,
          }),
        )
        .mockResolvedValueOnce(
          new Response("Server error", {
            status: 500,
          }),
        );

      const result = await request("http://custom-options.local", "/test", {
        retries: 1,
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(false);
      expect(result.attempts).toBe(2);
    });

    test("retry count of zero disables retries", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response("Server error", {
          status: 500,
        }),
      );

      const result = await request("http://no-retry.local", "/test", {
        retries: 0,
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.attempts).toBe(1);
      expect(result.ok).toBe(false);
    });

    test("supports lowercase HTTP methods", async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      await request("http://localhost:5000", "/test", {
        method: "patch",
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.method).toBe("PATCH");
    });
  });

  describe("circuit breaker recovery", () => {
    test("allows request after circuit reset period", async () => {
      jest.useFakeTimers();

      const baseUrl = "http://recoverable-circuit.local";

      try {
        // Open circuit.
        for (let i = 0; i < 5; i += 1) {
          global.fetch.mockResolvedValueOnce(
            new Response("Server error", {
              status: 500,
            }),
          );

          await request(baseUrl, `/failure-${i}`, {
            retries: 0,
          });
        }

        const status = getCircuitStatus();

        expect(status[baseUrl].state).toBe("OPEN");

        global.fetch.mockClear();

        // Move beyond the circuit reset time.
        jest.advanceTimersByTime(30001);

        global.fetch.mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              success: true,
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            },
          ),
        );

        const result = await request(baseUrl, "/after-reset");

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(result.ok).toBe(true);
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
