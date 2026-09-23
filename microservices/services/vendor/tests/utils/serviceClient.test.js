function loadClient(env = {}) {
  jest.resetModules();
  for (const key of [
    "SERVICE_REQUEST_TIMEOUT_MS", "SERVICE_REQUEST_RETRIES",
    "SERVICE_RETRY_DELAY_MS", "CIRCUIT_BREAKER_FAILURE_THRESHOLD",
    "CIRCUIT_BREAKER_RESET_TIMEOUT_MS", "INTERNAL_SERVICE_TOKEN"
  ]) delete process.env[key];
  Object.assign(process.env, env);
  return require("../../src/utils/serviceClient");
}

function response(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(body),
    headers,
  };
}

describe("serviceClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test("successful request parses JSON, builds URL and headers", async () => {
    const c = loadClient({ INTERNAL_SERVICE_TOKEN: "internal" });
    global.fetch.mockResolvedValue(response(200, '{"data":{"x":1}}'));
    const result = await c.request("http://service/", "/items", {
      method: "post",
      body: { x: 1 },
      headers: { "x-request-id": "req-1" },
    });
    expect(result).toMatchObject({ ok: true, status: 200, data: { data: { x: 1 } }, attempts: 1 });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://service/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ x: 1 }),
        headers: expect.objectContaining({
          "x-request-id": "req-1",
          "x-internal-service-token": "internal",
          "content-type": "application/json",
        }),
      })
    );
  });

  test("preserves an existing capitalized request id and content type", async () => {
    const c = loadClient();
    global.fetch.mockResolvedValue(response(200, ""));
    await c.request("http://service", "/x", {
      headers: { "X-Request-Id": "upper", "Content-Type": "text/plain" },
      body: Buffer.from("abc"),
    });
    const options = global.fetch.mock.calls[0][1];
    expect(options.headers["X-Request-Id"]).toBe("upper");
    expect(options.headers["x-request-id"]).toBeUndefined();
    expect(options.headers["Content-Type"]).toBe("text/plain");
    expect(Buffer.isBuffer(options.body)).toBe(true);
  });

  test("adds generated request id when caller supplies none", async () => {
    const c = loadClient();
    global.fetch.mockResolvedValue(response(200, "null"));
    await c.getJson("http://service", "/x");
    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers["x-request-id"]).toMatch(/^\d+-\d+-[a-z0-9]+$/);
  });

  test("returns null for an empty response", async () => {
    const c = loadClient();
    global.fetch.mockResolvedValue(response(204, ""));
    await expect(c.getJson("http://service", "/x")).resolves.toMatchObject({
      ok: true, status: 204, data: null, attempts: 1
    });
  });

  test("returns a safe object for invalid JSON", async () => {
    const c = loadClient();
    global.fetch.mockResolvedValue(response(200, "not-json"));
    const result = await c.getJson("http://service", "/x");
    expect(result.data).toEqual({
      success: false,
      message: "Invalid JSON response from downstream service.",
      raw: "not-json",
    });
  });

  test("does not retry a non-temporary 4xx response", async () => {
    const c = loadClient({ SERVICE_REQUEST_RETRIES: "3" });
    global.fetch.mockResolvedValue(response(400, '{"message":"bad"}'));
    const result = await c.getJson("http://service", "/x");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: false, status: 400, attempts: 1, error: null });
  });

  test("retries safe GET on temporary status and then succeeds", async () => {
    const c = loadClient({ SERVICE_REQUEST_RETRIES: "2", SERVICE_RETRY_DELAY_MS: "1" });
    jest.spyOn(Math, "random").mockReturnValue(0);
    global.fetch
      .mockResolvedValueOnce(response(503, '{"message":"temporary"}'))
      .mockResolvedValueOnce(response(200, '{"ok":true}'));
    const result = await c.getJson("http://service", "/x");
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ ok: true, attempts: 2, data: { ok: true } });
  });

  test("does not retry unsafe writes unless retrySafe is true", async () => {
    const c = loadClient({ SERVICE_REQUEST_RETRIES: "2" });
    global.fetch.mockResolvedValue(response(503, "{}"));
    const noRetry = await c.postJson("http://write", "/x", { a: 1 });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(noRetry.attempts).toBe(1);

    global.fetch.mockClear();
    global.fetch
      .mockResolvedValueOnce(response(503, "{}"))
      .mockResolvedValueOnce(response(201, '{"created":true}'));
    const retry = await c.postJson("http://write2", "/x", { a: 1 }, {}, {
      retrySafe: true,
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(retry.ok).toBe(true);
  });

  test.each([408, 429, 500, 502, 504])("retries GET for status %s", async (status) => {
    const c = loadClient({ SERVICE_REQUEST_RETRIES: "1", SERVICE_RETRY_DELAY_MS: "1" });
    jest.spyOn(Math, "random").mockReturnValue(0);
    global.fetch.mockResolvedValueOnce(response(status, "{}")).mockResolvedValueOnce(response(200, "{}"));
    await c.getJson("http://status-" + status, "/x");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("returns final 5xx and trips circuit after threshold failures", async () => {
    const c = loadClient({ SERVICE_REQUEST_RETRIES: "0", CIRCUIT_BREAKER_FAILURE_THRESHOLD: "2" });
    global.fetch.mockResolvedValue(response(500, "{}"));
    await c.getJson("http://circuit", "/x");
    const second = await c.getJson("http://circuit", "/x");
    expect(second.ok).toBe(false);
    const third = await c.getJson("http://circuit", "/x");
    expect(third).toMatchObject({ status: 503, attempts: 0, data: { code: "CIRCUIT_OPEN" } });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(c.getCircuitStatus()["http://circuit"]).toMatchObject({ state: "OPEN", failures: 2 });
  });

  test("opens circuit after network failures and reports network error", async () => {
    const c = loadClient({ SERVICE_REQUEST_RETRIES: "0", CIRCUIT_BREAKER_FAILURE_THRESHOLD: "1" });
    global.fetch.mockRejectedValue(new Error("socket down"));
    const result = await c.getJson("http://network", "/x");
    expect(result).toMatchObject({
      ok: false, status: 503, attempts: 1,
      data: { code: "DOWNSTREAM_UNAVAILABLE" },
      error: { type: "NETWORK_ERROR", message: "socket down" },
    });
    expect((await c.getJson("http://network", "/x")).data.code).toBe("CIRCUIT_OPEN");
  });

  test("returns 504 and timeout code for AbortError", async () => {
    const c = loadClient({ SERVICE_REQUEST_RETRIES: "0" });
    const err = new Error("aborted");
    err.name = "AbortError";
    global.fetch.mockRejectedValue(err);
    const result = await c.getJson("http://timeout", "/x");
    expect(result).toMatchObject({
      ok: false, status: 504, data: { code: "DOWNSTREAM_TIMEOUT" },
      error: { type: "TIMEOUT", message: "aborted" },
    });
  });

  test("retries network failures for safe methods", async () => {
    const c = loadClient({ SERVICE_REQUEST_RETRIES: "1", SERVICE_RETRY_DELAY_MS: "1" });
    jest.spyOn(Math, "random").mockReturnValue(0);
    global.fetch.mockRejectedValueOnce(new Error("temporary")).mockResolvedValueOnce(response(200, "{}"));
    const result = await c.getJson("http://retry-network", "/x");
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.attempts).toBe(2);
  });

  test("does not retry unsafe network failures unless retrySafe is true", async () => {
    const c = loadClient({ SERVICE_REQUEST_RETRIES: "2" });
    global.fetch.mockRejectedValue(new Error("write failure"));
    const result = await c.postJson("http://unsafe-network", "/x", {});
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.error.type).toBe("NETWORK_ERROR");
  });

  test("half-open circuit permits one recovery request and closes on success", async () => {
    const c = loadClient({
      SERVICE_REQUEST_RETRIES: "0",
      CIRCUIT_BREAKER_FAILURE_THRESHOLD: "1",
      CIRCUIT_BREAKER_RESET_TIMEOUT_MS: "0",
    });
    global.fetch.mockRejectedValueOnce(new Error("down"));
    await c.getJson("http://recover", "/x");
    global.fetch.mockResolvedValueOnce(response(200, '{"recovered":true}'));
    const result = await c.getJson("http://recover", "/x");
    expect(result.ok).toBe(true);
    expect(c.getCircuitStatus()["http://recover"].state).toBe("CLOSED");
  });

  test("half-open circuit rejects a concurrent second request", async () => {
    const c = loadClient({
      SERVICE_REQUEST_RETRIES: "0",
      CIRCUIT_BREAKER_FAILURE_THRESHOLD: "1",
      CIRCUIT_BREAKER_RESET_TIMEOUT_MS: "0",
    });
    global.fetch.mockRejectedValueOnce(new Error("down"));
    await c.getJson("http://half-open", "/x");
    let resolveFetch;
    global.fetch.mockImplementationOnce(() => new Promise(resolve => { resolveFetch = resolve; }));
    const first = c.getJson("http://half-open", "/one");
    await Promise.resolve();
    const second = await c.getJson("http://half-open", "/two");
    expect(second).toMatchObject({ status: 503, attempts: 0, data: { code: "CIRCUIT_OPEN" } });
    resolveFetch(response(200, "{}"));
    await first;
  });

  test("half-open failure reopens the circuit", async () => {
    const c = loadClient({
      SERVICE_REQUEST_RETRIES: "0",
      CIRCUIT_BREAKER_FAILURE_THRESHOLD: "1",
      CIRCUIT_BREAKER_RESET_TIMEOUT_MS: "0",
    });
    global.fetch.mockRejectedValueOnce(new Error("down"));
    await c.getJson("http://reopen", "/x");
    global.fetch.mockRejectedValueOnce(new Error("still down"));
    const result = await c.getJson("http://reopen", "/x");
    expect(result.error.type).toBe("NETWORK_ERROR");
    expect(c.getCircuitStatus()["http://reopen"].state).toBe("OPEN");
  });

  test("convenience methods use their expected HTTP methods", async () => {
    const c = loadClient();
    global.fetch.mockResolvedValue(response(200, "{}"));
    await c.getJson("http://svc", "/g");
    await c.postJson("http://svc", "/p", { a: 1 });
    await c.putJson("http://svc", "/u", { a: 1 });
    await c.patchJson("http://svc", "/pa", { a: 1 });
    await c.deleteJson("http://svc", "/d");
    expect(global.fetch.mock.calls.map(c => c[1].method)).toEqual([
      "GET", "POST", "PUT", "PATCH", "DELETE"
    ]);
  });

  test("accepts an invalid base URL for circuit-key fallback", async () => {
    const c = loadClient();
    global.fetch.mockResolvedValue(response(200, "{}"));
    const result = await c.request("not-a-url", "/x");
    expect(result.ok).toBe(true);
    expect(c.getCircuitStatus()["not-a-url"]).toBeDefined();
  });

  test("truncates invalid JSON raw response to 1000 characters", async () => {
    const c = loadClient();
    const raw = "x".repeat(1200);
    global.fetch.mockResolvedValue(response(200, raw));
    const result = await c.getJson("http://raw", "/x");
    expect(result.data.raw).toHaveLength(1000);
  });
});

