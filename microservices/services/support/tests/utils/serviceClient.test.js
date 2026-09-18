describe("support serviceClient", () => {
  let originalEnv;
  let fetchMock;

  beforeEach(() => {
    originalEnv = { ...process.env };

    process.env.SERVICE_REQUEST_TIMEOUT_MS = "50";
    process.env.SERVICE_REQUEST_RETRIES = "0";
    process.env.SERVICE_RETRY_DELAY_MS = "0";
    process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD = "5";
    process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS = "30000";

    fetchMock = jest.fn();
    global.fetch = fetchMock;

    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    delete global.fetch;
    jest.useRealTimers();
  });

  function load() {
    return require("../../src/utils/serviceClient");
  }

  function response(status, body, ok = status >= 200 && status < 300) {
    return {
      ok,
      status,
      text: jest.fn().mockResolvedValue(
        body === undefined ? "" : JSON.stringify(body)
      ),
    };
  }

  test("getCircuitKey uses URL origin", async () => {
    fetchMock.mockResolvedValue(response(200, { ok: true }));

    const { getCircuitStatus, request } = load();

    expect(getCircuitStatus()).toEqual({});

    await request("http://service.example/api", "/x");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://service.example/api/x"
    );
    expect(getCircuitStatus()["http://service.example"]).toMatchObject({
      state: "CLOSED",
      failures: 0,
    });
  });

  test("getCircuitKey falls back to raw base URL for invalid URL", async () => {
    fetchMock.mockResolvedValue(response(200, { ok: true }));

    const { request, getCircuitStatus } = load();

    await request("not-a-url", "/x");

    expect(fetchMock.mock.calls[0][0]).toBe("not-a-url/x");
    expect(getCircuitStatus()["not-a-url"]).toMatchObject({
      state: "CLOSED",
      failures: 0,
    });
  });

  test("successful GET returns parsed JSON and normalizes trailing slash", async () => {
    fetchMock.mockResolvedValue(response(200, { success: true }));

    const { getJson, getCircuitStatus } = load();
    const result = await getJson("http://service/", "/health");

    expect(result).toEqual({
      ok: true,
      status: 200,
      data: { success: true },
      error: null,
      attempts: 1,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://service/health",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "x-request-id": expect.any(String),
        }),
        body: undefined,
        signal: expect.any(AbortSignal),
      })
    );

    expect(getCircuitStatus()["http://service"]).toEqual({
      state: "CLOSED",
      failures: 0,
      openedAt: null,
    });
  });

  test("preserves caller request id and internal service token", async () => {
    process.env.INTERNAL_SERVICE_TOKEN = "internal-secret";
    fetchMock.mockResolvedValue(response(200, { ok: 1 }));

    const { request } = load();

    await request("http://service", "/x", {
      method: "GET",
      headers: {
        "x-request-id": "req-1",
        "x-internal-service-token": "caller-token",
      },
    });

    const options = fetchMock.mock.calls[0][1];
    expect(options.headers["x-request-id"]).toBe("req-1");
    expect(options.headers["x-internal-service-token"]).toBe("caller-token");
  });

  test("adds internal service token when not supplied", async () => {
    process.env.INTERNAL_SERVICE_TOKEN = "internal-secret";
    fetchMock.mockResolvedValue(response(200, {}));

    const { request } = load();

    await request("http://service", "/x");

    expect(fetchMock.mock.calls[0][1].headers).toEqual(
      expect.objectContaining({
        "x-internal-service-token": "internal-secret",
      })
    );
  });

  test("preserves uppercase request id", async () => {
    fetchMock.mockResolvedValue(response(200, {}));

    const { request } = load();

    await request("http://service", "/x", {
      headers: { "X-Request-Id": "upper" },
    });

    expect(fetchMock.mock.calls[0][1].headers["X-Request-Id"]).toBe("upper");
    expect(
      fetchMock.mock.calls[0][1].headers["x-request-id"]
    ).toBeUndefined();
  });

  test("serializes object bodies and sets content type", async () => {
    fetchMock.mockResolvedValue(response(201, { created: true }));

    const { postJson } = load();

    const result = await postJson(
      "http://service",
      "/items",
      { name: "test" }
    );

    expect(result.ok).toBe(true);

    const options = fetchMock.mock.calls[0][1];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ name: "test" }));
    expect(options.headers["content-type"]).toBe("application/json");
  });

  test("does not overwrite supplied content type", async () => {
    fetchMock.mockResolvedValue(response(200, {}));

    const { request } = load();

    await request("http://service", "/x", {
      method: "POST",
      body: { a: 1 },
      headers: { "Content-Type": "text/plain" },
    });

    expect(fetchMock.mock.calls[0][1].headers["content-type"]).toBe(
      "text/plain"
    );
    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBe(
      "text/plain"
    );
  });

  test("keeps string and Buffer bodies unchanged", async () => {
    fetchMock.mockResolvedValue(response(200, {}));

    const { request } = load();
    const buffer = Buffer.from("abc");

    await request("http://service", "/x", {
      method: "POST",
      body: "raw",
    });

    await request("http://service", "/x", {
      method: "POST",
      body: buffer,
    });

    expect(fetchMock.mock.calls[0][1].body).toBe("raw");
    expect(fetchMock.mock.calls[1][1].body).toBe(buffer);
  });

  test("parseResponse returns null for empty body", async () => {
    fetchMock.mockResolvedValue(response(204, undefined));

    const { request } = load();
    const result = await request("http://service", "/empty");

    expect(result.data).toBeNull();
  });

  test("parseResponse safely handles invalid JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("not-json"),
    });

    const { request } = load();
    const result = await request("http://service", "/x");

    expect(result.data).toEqual({
      success: false,
      message: "Invalid JSON response from downstream service.",
      raw: "not-json",
    });
  });

  test("returns non-retryable 400 response without retrying", async () => {
    fetchMock.mockResolvedValue(response(400, { error: "bad" }, false));

    const { request } = load();
    const result = await request("http://service", "/x", {
      method: "GET",
      retries: 3,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.attempts).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("retries safe GET on temporary status and succeeds", async () => {
    process.env.SERVICE_RETRY_DELAY_MS = "0";
    jest.resetModules();

    fetchMock
      .mockResolvedValueOnce(response(503, { error: "down" }, false))
      .mockResolvedValueOnce(response(200, { ok: true }));

    const { request } = load();
    const result = await request("http://retry-service", "/x", {
      method: "GET",
      retries: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
  });

  test("does not retry unsafe write unless retrySafe is true", async () => {
    fetchMock.mockResolvedValue(response(503, { error: "down" }, false));

    const { postJson } = load();
    const result = await postJson(
      "http://service",
      "/x",
      { a: 1 },
      {},
      { retries: 3 }
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.attempts).toBe(1);
  });

  test("retries unsafe write when retrySafe is explicitly enabled", async () => {
    fetchMock
      .mockResolvedValueOnce(response(503, {}, false))
      .mockResolvedValueOnce(response(200, { ok: true }));

    const { postJson } = load();
    const result = await postJson(
      "http://service",
      "/x",
      { a: 1 },
      {},
      { retries: 1, retrySafe: true }
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
  });

  test("handles network failure without retry", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { request } = load();

    const result = await request("http://service", "/x", {
      method: "POST",
    });

    expect(result).toMatchObject({
      ok: false,
      status: 503,
      attempts: 1,
      data: {
        success: false,
        message: "Downstream service unavailable.",
        code: "DOWNSTREAM_UNAVAILABLE",
      },
      error: {
        type: "NETWORK_ERROR",
        message: "network down",
      },
    });

    spy.mockRestore();
  });

  test("retries safe network failure then succeeds", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce(response(200, { recovered: true }));

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { request } = load();

    const result = await request("http://service", "/x", {
      method: "GET",
      retries: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);

    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  test("returns timeout response for AbortError", async () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    fetchMock.mockRejectedValue(abort);

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { request } = load();

    const result = await request("http://service", "/slow");

    expect(result).toMatchObject({
      ok: false,
      status: 504,
      data: {
        success: false,
        code: "DOWNSTREAM_TIMEOUT",
      },
      error: {
        type: "TIMEOUT",
      },
    });

    errorSpy.mockRestore();
  });

  test("opens circuit after configured number of failures", async () => {
    process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD = "2";
    process.env.SERVICE_REQUEST_RETRIES = "0";
    jest.resetModules();

    fetchMock.mockRejectedValue(new Error("down"));

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { request, getCircuitStatus } = load();

    await request("http://circuit", "/1", { method: "POST" });
    await request("http://circuit", "/2", { method: "POST" });

    expect(getCircuitStatus()["http://circuit"]).toMatchObject({
      state: "OPEN",
      failures: 2,
    });

    const result = await request("http://circuit", "/3", {
      method: "POST",
    });

    expect(result).toMatchObject({
      ok: false,
      status: 503,
      attempts: 0,
      data: {
        code: "CIRCUIT_OPEN",
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    errorSpy.mockRestore();
  });

  test("does not trip circuit on 4xx response", async () => {
    process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD = "1";
    jest.resetModules();

    fetchMock.mockResolvedValue(response(404, { error: "not found" }, false));

    const { request, getCircuitStatus } = load();

    await request("http://circuit4xx", "/x");

    expect(getCircuitStatus()["http://circuit4xx"]).toMatchObject({
      state: "CLOSED",
      failures: 0,
    });
  });

  test("half-open circuit allows one request after reset", async () => {
    process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD = "1";
    process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS = "100";
    jest.resetModules();

    fetchMock.mockRejectedValue(new Error("down"));

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { request, getCircuitStatus } = load();

    await request("http://half-open", "/x", { method: "POST" });

    expect(getCircuitStatus()["http://half-open"].state).toBe("OPEN");

    await new Promise((resolve) => setTimeout(resolve, 120));

    fetchMock.mockResolvedValue(response(200, { recovered: true }));

    const result = await request("http://half-open", "/recover");

    expect(result.ok).toBe(true);
    expect(getCircuitStatus()["http://half-open"].state).toBe("CLOSED");

    errorSpy.mockRestore();
  });

  test("half-open failure reopens the circuit", async () => {
    process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD = "1";
    process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS = "0";
    jest.resetModules();

    fetchMock.mockRejectedValue(new Error("down"));

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { request, getCircuitStatus } = load();

    await request("http://half-fail", "/x", { method: "POST" });

    await new Promise((resolve) => setTimeout(resolve, 5));

    await request("http://half-fail", "/again", { method: "POST" });

    expect(getCircuitStatus()["http://half-fail"].state).toBe("OPEN");

    errorSpy.mockRestore();
  });

  test("half-open circuit rejects a concurrent second request", async () => {
    process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD = "1";
    process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS = "0";
    jest.resetModules();

    fetchMock.mockRejectedValue(new Error("down"));

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { request } = load();

    await request("http://half-concurrent", "/x", { method: "POST" });

    const pending = new Promise(() => {});
    fetchMock.mockReturnValue(pending);

    const first = request("http://half-concurrent", "/recover");
    const second = await request("http://half-concurrent", "/blocked");

    expect(second).toMatchObject({
      ok: false,
      status: 503,
      attempts: 0,
      data: { code: "CIRCUIT_OPEN" },
    });

    // Avoid leaving the first request hanging.
    fetchMock.mockResolvedValue(response(200, {}));
    await Promise.race([
      first,
      new Promise((resolve) => setTimeout(resolve, 20)),
    ]);

    errorSpy.mockRestore();
  });


  test("abort controller actually fires when timeout expires", async () => {
    jest.useFakeTimers();

    fetchMock.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        })
    );

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { request } = load();

    const promise = request("http://timeout", "/x", {
      timeoutMs: 10,
      retries: 0,
    });

    jest.advanceTimersByTime(10);

    const result = await promise;

    expect(result).toMatchObject({
      ok: false,
      status: 504,
      error: { type: "TIMEOUT" },
    });

    errorSpy.mockRestore();
    jest.useRealTimers();
  });

  test("defensive fallback is reached when retries is NaN", async () => {
    fetchMock.mockResolvedValue(response(200, { unreachable: true }));

    const { request } = load();

    const result = await request("http://fallback", "/x", {
      retries: Number.NaN,
    });

    expect(result).toMatchObject({
      ok: false,
      status: 503,
      attempts: NaN,
      data: {
        success: false,
        message: "Downstream service unavailable.",
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("convenience methods set their HTTP methods", async () => {
    fetchMock.mockResolvedValue(response(200, {}));

    const {
      getJson,
      postJson,
      putJson,
      patchJson,
      deleteJson,
    } = load();

    await getJson("http://methods", "/g");
    await postJson("http://methods", "/p", {});
    await putJson("http://methods", "/u", {});
    await patchJson("http://methods", "/pa", {});
    await deleteJson("http://methods", "/d");

    expect(fetchMock.mock.calls.map((c) => c[1].method)).toEqual([
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ]);
  });
});

