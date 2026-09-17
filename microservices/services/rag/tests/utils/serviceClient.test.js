const {
  request,
  getJson,
  postJson,
  putJson,
  patchJson,
  deleteJson,
} = require("../../src/utils/serviceClient");

describe("serviceClient", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    jest.clearAllMocks();

    process.env.SERVICE_REQUEST_RETRIES = "0";
    process.env.SERVICE_REQUEST_TIMEOUT_MS = "1000";
    delete process.env.INTERNAL_SERVICE_TOKEN;
  });

  afterEach(() => {
    global.fetch = originalFetch;

    delete process.env.SERVICE_REQUEST_RETRIES;
    delete process.env.SERVICE_REQUEST_TIMEOUT_MS;
    delete process.env.INTERNAL_SERVICE_TOKEN;
  });

  describe("request", () => {
    test("should successfully make a GET request", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            success: true,
            data: { id: "123" },
          })
        ),
      });

      const result = await request(
        "http://localhost:5001/",
        "/users/123"
      );

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toEqual({
        success: true,
        data: { id: "123" },
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("http://localhost:5001/users/123");
      expect(options.method).toBe("GET");
      expect(options.headers["x-request-id"]).toBeDefined();
    });

    test("should remove trailing slash from base URL", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        text: jest.fn().mockResolvedValue('{"success":true}'),
      });

      await request("http://localhost:5001/", "/test");

      expect(global.fetch.mock.calls[0][0]).toBe(
        "http://localhost:5001/test"
      );
    });

    test("should stringify object request body", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        text: jest.fn().mockResolvedValue('{"success":true}'),
      });

      await request("http://localhost:5001", "/users", {
        method: "POST",
        body: {
          name: "John",
        },
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.body).toBe(
        JSON.stringify({
          name: "John",
        })
      );
    });

    test("should preserve string request body", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        text: jest.fn().mockResolvedValue('{"success":true}'),
      });

      await request("http://localhost:5001", "/users", {
        method: "POST",
        body: '{"name":"John"}',
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.body).toBe('{"name":"John"}');
    });

    test("should add internal service token when configured", async () => {
      process.env.INTERNAL_SERVICE_TOKEN = "test-internal-token";

      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        text: jest.fn().mockResolvedValue('{"success":true}'),
      });

      await request("http://localhost:5001", "/internal/users");

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers["x-internal-service-token"]).toBe(
        "test-internal-token"
      );
    });

    test("should preserve existing request ID", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        text: jest.fn().mockResolvedValue('{"success":true}'),
      });

      await request("http://localhost:5001", "/test", {
        headers: {
          "x-request-id": "existing-request-id",
        },
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers["x-request-id"]).toBe(
        "existing-request-id"
      );
    });

    test("should parse empty response as null", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 204,
        ok: true,
        text: jest.fn().mockResolvedValue(""),
      });

      const result = await request(
        "http://localhost:5001",
        "/test"
      );

      expect(result.ok).toBe(true);
      expect(result.data).toBeNull();
    });

    test("should handle invalid JSON response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        text: jest.fn().mockResolvedValue("not-json"),
      });

      const result = await request(
        "http://localhost:5001",
        "/test"
      );

      expect(result.ok).toBe(true);
      expect(result.data.success).toBe(false);
      expect(result.data.message).toBe(
        "Invalid JSON response from downstream service."
      );
      expect(result.data.raw).toBe("not-json");
    });

    test("should return downstream error response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 400,
        ok: false,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            success: false,
            message: "Bad request",
          })
        ),
      });

      const result = await request(
        "http://localhost:5001",
        "/test"
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(result.data.message).toBe("Bad request");
    });

    test("should retry retryable server errors", async () => {
      process.env.SERVICE_REQUEST_RETRIES = "1";

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          status: 503,
          ok: false,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              success: false,
              message: "Unavailable",
            })
          ),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              success: true,
            })
          ),
        });

      const result = await request(
        "http://localhost:5001",
        "/test"
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      expect(result.data.success).toBe(true);
    });

    test("should not retry unsafe method by default", async () => {
      process.env.SERVICE_REQUEST_RETRIES = "2";

      global.fetch = jest.fn().mockResolvedValue({
        status: 500,
        ok: false,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            success: false,
            message: "Server error",
          })
        ),
      });

      const result = await request(
        "http://localhost:5001",
        "/test",
        {
          method: "POST",
        }
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
    });

    test("should retry unsafe method when retrySafe is true", async () => {
      process.env.SERVICE_REQUEST_RETRIES = "1";

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          status: 500,
          ok: false,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              success: false,
            })
          ),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              success: true,
            })
          ),
        });

      const result = await request(
        "http://localhost:5001",
        "/test",
        {
          method: "POST",
          retrySafe: true,
        }
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
    });
  });

  describe("HTTP helper methods", () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            success: true,
          })
        ),
      });
    });

    test("getJson should make GET request", async () => {
      const result = await getJson(
        "http://localhost:5001",
        "/users"
      );

      expect(result.ok).toBe(true);
      expect(global.fetch.mock.calls[0][1].method).toBe("GET");
    });

    test("postJson should make POST request", async () => {
      await postJson(
        "http://localhost:5001",
        "/users",
        { name: "John" }
      );

      const [, options] = global.fetch.mock.calls[0];

      expect(options.method).toBe("POST");
      expect(options.body).toBe(
        JSON.stringify({ name: "John" })
      );
    });

    test("putJson should make PUT request", async () => {
      await putJson(
        "http://localhost:5001",
        "/users/1",
        { name: "Jane" }
      );

      const [, options] = global.fetch.mock.calls[0];

      expect(options.method).toBe("PUT");
      expect(options.body).toBe(
        JSON.stringify({ name: "Jane" })
      );
    });

    test("patchJson should make PATCH request", async () => {
      await patchJson(
        "http://localhost:5001",
        "/users/1",
        { name: "Jane" }
      );

      const [, options] = global.fetch.mock.calls[0];

      expect(options.method).toBe("PATCH");
      expect(options.body).toBe(
        JSON.stringify({ name: "Jane" })
      );
    });

    test("deleteJson should make DELETE request", async () => {
      await deleteJson(
        "http://localhost:5001",
        "/users/1"
      );

      const [, options] = global.fetch.mock.calls[0];

      expect(options.method).toBe("DELETE");
    });
  });
});