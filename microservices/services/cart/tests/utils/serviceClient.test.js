process.env.SERVICE_REQUEST_TIMEOUT_MS = "20";
process.env.SERVICE_REQUEST_RETRIES = "1";
process.env.SERVICE_RETRY_DELAY_MS = "0";
process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD = "2";
process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS = "10";
process.env.INTERNAL_SERVICE_TOKEN = "test-internal-token";

const {
  request,
  getJson,
  postJson,
  putJson,
  patchJson,
  deleteJson,
  getCircuitStatus,
} = require("../../src/utils/serviceClient");

function jsonResponse(ok, status, body) {
  return {
    ok,
    status,
    text: jest
      .fn()
      .mockResolvedValue(body === undefined ? "" : JSON.stringify(body)),
  };
}

describe("serviceClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /*
   * ---------------------------------------------------------------
   * Basic requests
   * ---------------------------------------------------------------
   */

  test("performs a successful GET request", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(true, 200, {
        success: true,
        data: { id: "123" },
      }),
    );

    const result = await request(
      "http://service-a.local",
      "/internal/users/123",
    );

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({
      success: true,
      data: { id: "123" },
    });
    expect(result.attempts).toBe(1);

    const [url, options] = global.fetch.mock.calls[0];

    expect(url).toBe("http://service-a.local/internal/users/123");
    expect(options.method).toBe("GET");
  });

  test("removes trailing slash from base URL", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await request("http://service-a.local/", "/users");

    expect(global.fetch.mock.calls[0][0]).toBe("http://service-a.local/users");
  });

  test("uses GET when method is omitted", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await request("http://default-method.local", "/test");

    expect(global.fetch.mock.calls[0][1].method).toBe("GET");
  });

  /*
   * ---------------------------------------------------------------
   * Headers
   * ---------------------------------------------------------------
   */

  test("adds internal service token", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await request("http://service-token.local", "/internal/test");

    const [, options] = global.fetch.mock.calls[0];

    expect(options.headers["x-internal-service-token"]).toBe(
      "test-internal-token",
    );
  });

  test("preserves an explicit internal service token", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await request("http://service-token-2.local", "/internal/test", {
      headers: {
        "x-internal-service-token": "custom-token",
      },
    });

    const [, options] = global.fetch.mock.calls[0];

    expect(options.headers["x-internal-service-token"]).toBe("custom-token");
  });

  test("generates a request id", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await request("http://request-id.local", "/test");

    const [, options] = global.fetch.mock.calls[0];

    expect(options.headers["x-request-id"]).toBeDefined();
    expect(typeof options.headers["x-request-id"]).toBe("string");
  });

  test("preserves an existing lowercase request id", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await request("http://request-id-2.local", "/test", {
      headers: {
        "x-request-id": "request-123",
      },
    });

    const [, options] = global.fetch.mock.calls[0];

    expect(options.headers["x-request-id"]).toBe("request-123");
  });

  test("preserves an existing uppercase request id", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await request("http://request-id-3.local", "/test", {
      headers: {
        "X-Request-Id": "request-uppercase",
      },
    });

    const [, options] = global.fetch.mock.calls[0];

    expect(options.headers["X-Request-Id"]).toBe("request-uppercase");

    expect(options.headers["x-request-id"]).toBeUndefined();
  });

  /*
   * ---------------------------------------------------------------
   * JSON bodies
   * ---------------------------------------------------------------
   */

  test("serializes JSON POST body", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 201, {}));

    await postJson("http://methods.local", "/test", {
      name: "John",
    });

    const [, options] = global.fetch.mock.calls[0];

    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ name: "John" }));
    expect(options.headers["content-type"]).toBe("application/json");
  });

  test("preserves an existing lowercase content-type", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await request("http://content-type.local", "/test", {
      method: "POST",
      body: {
        value: 1,
      },
      headers: {
        "content-type": "application/custom+json",
      },
    });

    const [, options] = global.fetch.mock.calls[0];

    expect(options.headers["content-type"]).toBe("application/custom+json");
  });

  test("preserves an existing uppercase Content-Type", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await request("http://content-type-uppercase.local", "/test", {
      method: "POST",
      body: {
        value: 1,
      },
      headers: {
        "Content-Type": "application/custom+json",
      },
    });

    const [, options] = global.fetch.mock.calls[0];

    expect(options.headers["Content-Type"]).toBe("application/custom+json");
  });

  test("does not serialize a string body", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await request("http://string-body.local", "/test", {
      method: "POST",
      body: "already serialized",
    });

    const [, options] = global.fetch.mock.calls[0];

    expect(options.body).toBe("already serialized");
    expect(options.headers["content-type"]).toBeUndefined();
  });

  test("does not serialize a Buffer body", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    const body = Buffer.from("hello");

    await request("http://buffer-body.local", "/test", {
      method: "POST",
      body,
    });

    const [, options] = global.fetch.mock.calls[0];

    expect(options.body).toBe(body);
  });

  test("allows null body", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await request("http://null-body.local", "/test", {
      method: "POST",
      body: null,
    });

    const [, options] = global.fetch.mock.calls[0];

    expect(options.body).toBeNull();
  });

  /*
   * ---------------------------------------------------------------
   * HTTP verbs
   * ---------------------------------------------------------------
   */

  test("supports PUT", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await putJson("http://put.local", "/test", {
      name: "Updated",
    });

    expect(global.fetch.mock.calls[0][1].method).toBe("PUT");
  });

  test("supports PATCH", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await patchJson("http://patch.local", "/test", {
      active: true,
    });

    expect(global.fetch.mock.calls[0][1].method).toBe("PATCH");
  });

  test("supports DELETE", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 204));

    const result = await deleteJson("http://delete.local", "/test");

    expect(global.fetch.mock.calls[0][1].method).toBe("DELETE");

    expect(result.ok).toBe(true);
    expect(result.status).toBe(204);
    expect(result.data).toBeNull();
  });

  test("supports HEAD", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    const result = await request("http://head.local", "/test", {
      method: "HEAD",
    });

    expect(result.ok).toBe(true);
    expect(global.fetch.mock.calls[0][1].method).toBe("HEAD");
  });

  test("supports OPTIONS", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    const result = await request("http://options.local", "/test", {
      method: "OPTIONS",
    });

    expect(result.ok).toBe(true);
    expect(global.fetch.mock.calls[0][1].method).toBe("OPTIONS");
  });

  /*
   * ---------------------------------------------------------------
   * Response parsing
   * ---------------------------------------------------------------
   */

  test("handles invalid JSON safely", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("not-json"),
    });

    const result = await getJson("http://invalid-json.local", "/test");

    expect(result.ok).toBe(true);
    expect(result.data.success).toBe(false);
    expect(result.data.message).toMatch(
      /Invalid JSON response from downstream service/,
    );
    expect(result.data.raw).toBe("not-json");
  });

  test("handles empty response body", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200));

    const result = await getJson("http://empty-response.local", "/test");

    expect(result.ok).toBe(true);
    expect(result.data).toBeNull();
  });

  test("limits invalid JSON raw response to 1000 characters", async () => {
    const longBody = "x".repeat(2000);

    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(longBody),
    });

    const result = await getJson("http://long-invalid-json.local", "/test");

    expect(result.data.raw).toHaveLength(1000);
  });

  /*
   * ---------------------------------------------------------------
   * HTTP retry behavior
   * ---------------------------------------------------------------
   */

  test("retries 500 for GET", async () => {
    global.fetch
      .mockResolvedValueOnce(
        jsonResponse(false, 500, {
          success: false,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(true, 200, {
          success: true,
        }),
      );

    const result = await getJson("http://retry-500.local", "/test");

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
  });

  test.each([408, 429, 500, 502, 503, 504])(
    "retries HTTP %s for GET",
    async (status) => {
      global.fetch
        .mockResolvedValueOnce(jsonResponse(false, status, {}))
        .mockResolvedValueOnce(jsonResponse(true, 200, {}));

      const result = await getJson(`http://retry-${status}.local`, "/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);

      expect(result.ok).toBe(true);
    },
  );

  test("does not retry 400 by default", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(false, 400, {
        success: false,
        message: "Bad request",
      }),
    );

    const result = await getJson("http://no-retry-400.local", "/test");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  test("does not trip circuit for 400 response", async () => {
    global.fetch.mockResolvedValue(jsonResponse(false, 400, {}));

    await getJson("http://no-circuit-400.local", "/test");

    await getJson("http://no-circuit-400.local", "/test");

    expect(getCircuitStatus()["http://no-circuit-400.local"].state).toBe(
      "CLOSED",
    );
  });

  test("returns final 500 after retry exhaustion", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(false, 500, {
        success: false,
      }),
    );

    const result = await getJson("http://retry-exhausted.local", "/test");

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.attempts).toBe(2);
  });

  test("does not retry unsafe POST by default", async () => {
    global.fetch.mockResolvedValue(jsonResponse(false, 500, {}));

    const result = await postJson("http://unsafe-post.local", "/test", {
      value: 1,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
  });

  test("retries unsafe POST when retrySafe is true", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse(false, 500, {}))
      .mockResolvedValueOnce(jsonResponse(true, 200, {}));

    const result = await request("http://safe-post.local", "/test", {
      method: "POST",
      body: {
        value: 1,
      },
      retrySafe: true,
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
  });

  test("does not retry unsafe POST when retrySafe is explicitly false", async () => {
    global.fetch.mockResolvedValue(jsonResponse(false, 500, {}));

    const result = await request("http://unsafe-post-explicit.local", "/test", {
      method: "POST",
      body: {
        value: 1,
      },
      retrySafe: false,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
  });

  test("retries HEAD on temporary HTTP failure", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse(false, 503, {}))
      .mockResolvedValueOnce(jsonResponse(true, 200, {}));

    const result = await request("http://head-retry.local", "/test", {
      method: "HEAD",
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
  });

  test("retries OPTIONS on temporary HTTP failure", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse(false, 503, {}))
      .mockResolvedValueOnce(jsonResponse(true, 200, {}));

    const result = await request("http://options-retry.local", "/test", {
      method: "OPTIONS",
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
  });

  /*
   * ---------------------------------------------------------------
   * Network failures
   * ---------------------------------------------------------------
   */

  test("retries network failure for GET", async () => {
    global.fetch
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockResolvedValueOnce(jsonResponse(true, 200, {}));

    const result = await getJson("http://network-retry.local", "/test");

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
  });

  test("returns downstream unavailable after network failures", async () => {
    global.fetch.mockRejectedValue(new Error("connection refused"));

    const result = await getJson("http://network-failure.local", "/test");

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(503);
    expect(result.data.code).toBe("DOWNSTREAM_UNAVAILABLE");
    expect(result.error.type).toBe("NETWORK_ERROR");
  });

  test("does not retry network failure for unsafe POST", async () => {
    global.fetch.mockRejectedValue(new Error("connection refused"));

    const result = await postJson(
      "http://post-network-failure.local",
      "/test",
      {
        value: 1,
      },
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(503);
    expect(result.data.code).toBe("DOWNSTREAM_UNAVAILABLE");
  });

  test("retries network failure for retrySafe POST", async () => {
    global.fetch
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockResolvedValueOnce(jsonResponse(true, 200, {}));

    const result = await request("http://safe-post-network.local", "/test", {
      method: "POST",
      body: {
        value: 1,
      },
      retrySafe: true,
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
  });

  /*
   * ---------------------------------------------------------------
   * Timeout handling
   * ---------------------------------------------------------------
   */

  test("returns downstream timeout for AbortError", async () => {
    global.fetch.mockImplementation(
      (url, options) =>
        new Promise((resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );

    const result = await getJson("http://timeout.local", "/test");

    expect(result.ok).toBe(false);
    expect(result.status).toBe(504);
    expect(result.data.code).toBe("DOWNSTREAM_TIMEOUT");
    expect(result.error.type).toBe("TIMEOUT");
  });

  test("retries timeout for GET", async () => {
    global.fetch
      .mockRejectedValueOnce(
        Object.assign(new Error("aborted"), {
          name: "AbortError",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(true, 200, {}));

    const result = await getJson("http://timeout-retry.local", "/test");

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
  });

  test("returns timeout after all retry attempts fail", async () => {
    global.fetch.mockRejectedValue(
      Object.assign(new Error("aborted"), {
        name: "AbortError",
      }),
    );

    const result = await getJson("http://timeout-exhausted.local", "/test");

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(504);
    expect(result.data.code).toBe("DOWNSTREAM_TIMEOUT");
    expect(result.attempts).toBe(2);
  });

  /*
   * ---------------------------------------------------------------
   * Retry configuration
   * ---------------------------------------------------------------
   */

  test("supports retries: 0", async () => {
    global.fetch.mockResolvedValue(jsonResponse(false, 500, {}));

    const result = await getJson(
      "http://zero-retries.local",
      "/test",
      {},
      {
        retries: 0,
      },
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(1);
  });

  test("supports custom retry count", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse(false, 500, {}))
      .mockResolvedValueOnce(jsonResponse(false, 500, {}))
      .mockResolvedValueOnce(jsonResponse(true, 200, {}));

    const result = await getJson(
      "http://custom-retries.local",
      "/test",
      {},
      {
        retries: 2,
      },
    );

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(3);
  });

  test("supports custom timeout", async () => {
    global.fetch.mockImplementation(
      (url, options) =>
        new Promise((resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );

    const result = await request("http://custom-timeout.local", "/test", {
      timeoutMs: 5,
      retries: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(504);
  });

  /*
   * ---------------------------------------------------------------
   * Circuit breaker
   * ---------------------------------------------------------------
   */

  test("opens circuit after repeated server failures", async () => {
    global.fetch.mockResolvedValue(jsonResponse(false, 500, {}));

    await getJson("http://circuit.local", "/test");

    await getJson("http://circuit.local", "/test");

    const status = getCircuitStatus();

    expect(status["http://circuit.local"]).toBeDefined();

    expect(status["http://circuit.local"].state).toBe("OPEN");

    const callsBefore = global.fetch.mock.calls.length;

    const result = await getJson("http://circuit.local", "/test");

    expect(result.status).toBe(503);

    expect(result.data.code).toBe("CIRCUIT_OPEN");

    expect(global.fetch.mock.calls.length).toBe(callsBefore);
  });

  test("uses origin as circuit key", async () => {
    global.fetch.mockResolvedValue(jsonResponse(false, 500, {}));

    await getJson("http://same-origin.local/path-one", "/test");

    await getJson("http://same-origin.local/path-two", "/test");

    const status = getCircuitStatus();

    expect(status["http://same-origin.local"]).toBeDefined();

    expect(status["http://same-origin.local"].state).toBe("OPEN");
  });

  test("handles invalid base URL when creating circuit key", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    const result = await request("not-a-valid-url", "/test");

    expect(result.ok).toBe(true);

    expect(getCircuitStatus()["not-a-valid-url"]).toBeDefined();
  });

  test("moves OPEN circuit to HALF_OPEN after reset timeout", async () => {
    global.fetch.mockResolvedValue(jsonResponse(false, 500, {}));

    await getJson("http://half-open.local", "/test");

    await getJson("http://half-open.local", "/test");

    expect(getCircuitStatus()["http://half-open.local"].state).toBe("OPEN");

    await new Promise((resolve) => setTimeout(resolve, 15));

    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    const result = await getJson("http://half-open.local", "/test");

    expect(result.ok).toBe(true);

    expect(getCircuitStatus()["http://half-open.local"].state).toBe("CLOSED");
  });

  test("half-open failure opens circuit again", async () => {
    global.fetch.mockResolvedValue(jsonResponse(false, 500, {}));

    await getJson("http://half-open-failure.local", "/test");

    await getJson("http://half-open-failure.local", "/test");

    await new Promise((resolve) => setTimeout(resolve, 15));

    await getJson("http://half-open-failure.local", "/test");

    expect(getCircuitStatus()["http://half-open-failure.local"].state).toBe(
      "OPEN",
    );
  });

  test("half-open allows only one request", async () => {
    global.fetch.mockResolvedValue(jsonResponse(false, 500, {}));

    await getJson("http://half-open-one-request.local", "/test");

    await getJson("http://half-open-one-request.local", "/test");

    await new Promise((resolve) => setTimeout(resolve, 15));

    /*
     * First request moves circuit to HALF_OPEN.
     * Make it remain pending so the second request
     * sees halfOpenRequests === 1.
     */
    let resolveFetch;

    global.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const firstRequest = getJson("http://half-open-one-request.local", "/test");

    /*
     * Give the first request enough time to enter fetch.
     */
    await new Promise((resolve) => setTimeout(resolve, 0));

    const secondResult = await getJson(
      "http://half-open-one-request.local",
      "/test",
    );

    expect(secondResult.status).toBe(503);
    expect(secondResult.data.code).toBe("CIRCUIT_OPEN");

    resolveFetch(jsonResponse(true, 200, {}));

    const firstResult = await firstRequest;

    expect(firstResult.ok).toBe(true);
  });

  /*
   * ---------------------------------------------------------------
   * Convenience methods
   * ---------------------------------------------------------------
   */

  test("convenience methods use correct HTTP verbs", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await getJson("http://verbs.local", "/get");

    await postJson("http://verbs.local", "/post", {});

    await putJson("http://verbs.local", "/put", {});

    await patchJson("http://verbs.local", "/patch", {});

    await deleteJson("http://verbs.local", "/delete");

    expect(
      global.fetch.mock.calls.map(([, options]) => options.method),
    ).toEqual(["GET", "POST", "PUT", "PATCH", "DELETE"]);
  });

  /*
   * ---------------------------------------------------------------
   * Fetch options propagation
   * ---------------------------------------------------------------
   */

  test("passes additional fetch options through", async () => {
    global.fetch.mockResolvedValue(jsonResponse(true, 200, {}));

    await request("http://options.local", "/test", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const [, options] = global.fetch.mock.calls[0];

    expect(options.credentials).toBe("include");
    expect(options.cache).toBe("no-store");
  });
});
