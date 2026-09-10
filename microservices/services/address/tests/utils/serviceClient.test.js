process.env.SERVICE_REQUEST_TIMEOUT_MS = "20";
process.env.SERVICE_REQUEST_RETRIES = "1";
process.env.SERVICE_RETRY_DELAY_MS = "0";
process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD = "2";
process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS = "10";
process.env.INTERNAL_SERVICE_TOKEN = "test-internal-token";

jest.mock("crypto", () => ({
  ...jest.requireActual("crypto"),
  randomInt: jest.fn(),
}));

const crypto = require("crypto");

beforeEach(() => {
  crypto.randomInt.mockReturnValue(1);
});

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
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("successful requests", () => {
    test("performs a successful GET request", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            success: true,
            data: {
              id: "123",
            },
          }),
        ),
      });

      const result = await request(
        "http://localhost:5002",
        "/internal/users/123",
      );

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toEqual({
        success: true,
        data: {
          id: "123",
        },
      });
      expect(result.error).toBeNull();
      expect(result.attempts).toBe(1);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("http://localhost:5002/internal/users/123");

      expect(options.method).toBe("GET");
    });

    test("adds internal service token", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request("http://localhost:5002", "/internal/test");

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers["x-internal-service-token"]).toBe(
        "test-internal-token",
      );
    });

    test("does not overwrite explicit internal service token", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request("http://localhost:5002", "/internal/test", {
        headers: {
          "x-internal-service-token": "custom-token",
        },
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers["x-internal-service-token"]).toBe("custom-token");
    });

    test("generates request id", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request("http://localhost:5002", "/internal/test");

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers["x-request-id"]).toBeDefined();
      expect(typeof options.headers["x-request-id"]).toBe("string");
    });

    test("preserves existing request id", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await request("http://localhost:5002", "/internal/test", {
        headers: {
          "x-request-id": "request-123",
        },
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers["x-request-id"]).toBe("request-123");
    });
  });

  describe("request bodies and HTTP methods", () => {
    test("serializes JSON POST body", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 201,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await postJson("http://localhost:5002", "/internal/test", {
        name: "John",
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.method).toBe("POST");

      expect(options.body).toBe(
        JSON.stringify({
          name: "John",
        }),
      );

      expect(options.headers["content-type"]).toBe("application/json");
    });

    test("supports PUT", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await putJson("http://localhost:5002", "/internal/test", {
        name: "Updated",
      });

      expect(global.fetch.mock.calls[0][1].method).toBe("PUT");
    });

    test("supports PATCH", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("{}"),
      });

      await patchJson("http://localhost:5002", "/internal/test", {
        active: true,
      });

      expect(global.fetch.mock.calls[0][1].method).toBe("PATCH");
    });

    test("supports DELETE", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 204,
        text: jest.fn().mockResolvedValue(""),
      });

      const result = await deleteJson(
        "http://localhost:5002",
        "/internal/test",
      );

      expect(global.fetch.mock.calls[0][1].method).toBe("DELETE");

      expect(result.ok).toBe(true);
      expect(result.status).toBe(204);
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe("response parsing", () => {
    test("handles empty response", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 204,
        text: jest.fn().mockResolvedValue(""),
      });

      const result = await getJson("http://empty-response.local", "/empty");

      expect(result.ok).toBe(true);
      expect(result.status).toBe(204);
      expect(result.data).toBeNull();
    });

    test("parses JSON response", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            success: true,
            data: "hello",
          }),
        ),
      });

      const result = await getJson("http://json-response.local", "/test");

      expect(result.ok).toBe(true);

      expect(result.data).toEqual({
        success: true,
        data: "hello",
      });

      expect(result.error).toBeNull();
    });

    test("handles invalid JSON response", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("this is not json"),
      });

      const result = await getJson("http://invalid-json.local", "/bad-json");

      expect(result.ok).toBe(true);

      expect(result.data.success).toBe(false);

      expect(result.data.message).toMatch(/Invalid JSON response/);

      expect(result.data.raw).toBe("this is not json");
    });
  });

  describe("HTTP retries", () => {
    test("retries 500 response", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              success: false,
            }),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              success: true,
            }),
          ),
        });

      const result = await getJson("http://retry-500.local", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toEqual({
        success: true,
      });

      expect(result.attempts).toBe(2);
    });

    test.each([502, 503, 504])("retries HTTP %s response", async (status) => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status,
          text: jest.fn().mockResolvedValue("{}"),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue("{}"),
        });

      const result = await getJson(`http://retry-${status}.local`, "/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
    });

    test("does not retry 400 by default", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            success: false,
            message: "Bad request",
          }),
        ),
      });

      const result = await getJson("http://no-retry-400.local", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(1);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
    });

    test("does not retry unsafe POST by default", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue("{}"),
      });

      const result = await postJson("http://unsafe-post.local", "/test", {
        value: 1,
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
    });

    test("retries unsafe request when retrySafe is enabled", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: jest.fn().mockResolvedValue("{}"),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue("{}"),
        });

      const result = await request("http://unsafe-retry.local", "/test", {
        method: "POST",
        body: {
          value: 1,
        },
        retrySafe: true,
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
    });
  });

  describe("network errors", () => {
    test("retries network failure", async () => {
      global.fetch
        .mockRejectedValueOnce(new Error("connection refused"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue("{}"),
        });

      const result = await getJson("http://network-retry.local", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);

      expect(result.ok).toBe(true);
      expect(result.data).toEqual({});
      expect(result.attempts).toBe(2);
    });

    test("returns downstream unavailable after network failures", async () => {
      global.fetch.mockRejectedValue(new Error("connection refused"));

      const result = await getJson("http://network-failure.local", "/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);

      expect(result.ok).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data.error.code).toBe("DOWNSTREAM_UNAVAILABLE");
    });
  });

  describe("timeouts", () => {
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

      const result = await getJson("http://timeout.local", "/test", {
        timeoutMs: 1,
        retries: 0,
      });

      expect(result.ok).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data.error.code).toBe("DOWNSTREAM_TIMEOUT");
      expect(result.status).toBe(504);
    });
  });

  describe("circuit breaker", () => {
    it("opens after configured failures", async () => {
      const baseUrl = "http://circuit-test.local";

      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers({ "content-type": "application/json" }),
          text: async () => JSON.stringify({ message: "server error" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers({ "content-type": "application/json" }),
          text: async () => JSON.stringify({ message: "server error" }),
        });

      await getJson(`${baseUrl}/first`, {
        retries: 0,
      });

      await getJson(`${baseUrl}/second`, {
        retries: 0,
      });

      const status = getCircuitStatus(baseUrl);

      expect(status).toBeDefined();
      expect(status.state).toBe("OPEN");
      expect(status.failures).toBe(2);

      global.fetch.mockClear();

      const blocked = await getJson(`${baseUrl}/third`, {
        retries: 0,
      });

      expect(blocked.ok).toBe(false);
      expect(blocked.data.error.code).toBe("CIRCUIT_OPEN");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("recovers after circuit reset timeout", async () => {
      const baseUrl = "http://half-open.local";

      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers({ "content-type": "application/json" }),
          text: async () => JSON.stringify({ message: "server error" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers({ "content-type": "application/json" }),
          text: async () => JSON.stringify({ message: "server error" }),
        });

      await getJson(`${baseUrl}/one`, {
        retries: 0,
      });

      await getJson(`${baseUrl}/two`, {
        retries: 0,
      });

      expect(getCircuitStatus(baseUrl)).toBeDefined();
      expect(getCircuitStatus(baseUrl).state).toBe("OPEN");

      await new Promise((resolve) => setTimeout(resolve, 25));

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: async () => JSON.stringify({ success: true }),
      });

      const result = await getJson(`${baseUrl}/three`, {
        retries: 0,
      });

      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ success: true });

      expect(getCircuitStatus(baseUrl).state).toBe("CLOSED");
    });
  });
});
