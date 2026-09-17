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

      SERVICE_REQUEST_TIMEOUT_MS: "1000",
      SERVICE_REQUEST_RETRIES: "0",
      SERVICE_RETRY_DELAY_MS: "0",

      SERVICE_CIRCUIT_FAILURE_THRESHOLD: "5",
      SERVICE_CIRCUIT_RESET_MS: "30000",

      INTERNAL_SERVICE_TOKEN: "test-internal-token",
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

    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();

    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  test("returns successful JSON response", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: "123",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    );

    const result = await request(
      "http://localhost:5000",
      "/api/products"
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        status: 200,
        data: {
          success: true,
          data: {
            id: "123",
          },
        },
        attempts: 1,
      })
    );
  });

  test("uses GET by default", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    );

    await request(
      "http://localhost:5000",
      "/api/products"
    );

    const [url, options] =
      global.fetch.mock.calls[0];

    expect(url).toBe(
      "http://localhost:5000/api/products"
    );

    expect(options.method).toBe("GET");
  });

  test("combines base URL and path correctly", async () => {
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
        }
      )
    );

    await request(
      "http://localhost:5000/",
      "/api/products"
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/products",
      expect.any(Object)
    );
  });

  test("getJson uses GET", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      })
    );

    await getJson(
      "http://localhost:5000",
      "/api/products"
    );

    expect(global.fetch.mock.calls[0][1].method).toBe(
      "GET"
    );
  });

  test("postJson uses POST and body", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      })
    );

    await postJson(
      "http://localhost:5000",
      "/api/products",
      {
        name: "Phone",
      }
    );

    const [, options] =
      global.fetch.mock.calls[0];

    expect(options.method).toBe("POST");

    expect(options.body).toBe(
      JSON.stringify({
        name: "Phone",
      })
    );
  });

  test("putJson uses PUT", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      })
    );

    await putJson(
      "http://localhost:5000",
      "/api/products/1",
      {
        name: "Updated",
      }
    );

    expect(
      global.fetch.mock.calls[0][1].method
    ).toBe("PUT");
  });

  test("patchJson uses PATCH", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      })
    );

    await patchJson(
      "http://localhost:5000",
      "/api/products/1",
      {
        stock: 10,
      }
    );

    expect(
      global.fetch.mock.calls[0][1].method
    ).toBe("PATCH");
  });

  test("deleteJson uses DELETE", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      })
    );

    await deleteJson(
      "http://localhost:5000",
      "/api/products/1"
    );

    expect(
      global.fetch.mock.calls[0][1].method
    ).toBe("DELETE");
  });

  test("returns unsuccessful HTTP response", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          message: "Not found",
        }),
        {
          status: 404,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    );

    const result = await request(
      "http://localhost:5000",
      "/api/products/unknown"
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
  });

  test("handles network failure", async () => {
    global.fetch.mockRejectedValueOnce(
      new Error("Network failure")
    );

    const result = await request(
      "http://network-failure.local",
      "/test",
      {
        retries: 0,
      }
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe(503);
  });

  test("creates circuit state after service failure", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response("Server error", {
        status: 500,
      })
    );

    const baseUrl =
      "http://failure-count.local";

    const result = await request(
      baseUrl,
      "/test",
      {
        retries: 0,
      }
    );

    expect(result.ok).toBe(false);

    const status = getCircuitStatus();

    expect(status[baseUrl]).toEqual(
      expect.objectContaining({
        failures: 1,
        state: "CLOSED",
        openedAt: null,
      })
    );
  });

  test("opens circuit after configured failures", async () => {
    const baseUrl =
      "http://circuit-test.local";

    for (let i = 0; i < 5; i += 1) {
      global.fetch.mockResolvedValueOnce(
        new Response("Server error", {
          status: 500,
        })
      );

      await request(
        baseUrl,
        `/failure-${i}`,
        {
          retries: 0,
        }
      );
    }

    const status = getCircuitStatus();

    expect(status[baseUrl]).toEqual(
      expect.objectContaining({
        failures: 5,
        state: "OPEN",
      })
    );

    expect(status[baseUrl].openedAt).not.toBeNull();
  });

  test("does not call fetch when circuit is open", async () => {
    const baseUrl =
      "http://open-circuit.local";

    for (let i = 0; i < 5; i += 1) {
      global.fetch.mockResolvedValueOnce(
        new Response("Server error", {
          status: 500,
        })
      );

      await request(
        baseUrl,
        `/failure-${i}`,
        {
          retries: 0,
        }
      );
    }

    global.fetch.mockClear();

    const result = await request(
      baseUrl,
      "/should-not-call"
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });

  test("different origins maintain separate circuit states", async () => {
    const serviceA =
      "http://service-a.local";

    const serviceB =
      "http://service-b.local";

    for (let i = 0; i < 5; i += 1) {
      global.fetch.mockResolvedValueOnce(
        new Response("Server error", {
          status: 500,
        })
      );

      await request(
        serviceA,
        `/failure-${i}`,
        {
          retries: 0,
        }
      );
    }

    const status = getCircuitStatus();

    expect(status[serviceA].state).toBe("OPEN");
    expect(status[serviceB]).toBeUndefined();
  });

  test("returns empty circuit map initially", () => {
    expect(getCircuitStatus()).toEqual({});
  });
});