import { api, configureAccessTokenGetter } from "../../src/api/client";
describe("api client", () => {
  const originalFetch = global.fetch;
  const originalLocalStorage = global.localStorage;
  beforeEach(() => {
    jest.clearAllMocks();
    configureAccessTokenGetter(null);
    global.localStorage?.clear?.();
    const store = {};
    global.localStorage = {
      getItem: jest.fn((key) => store[key] ?? null),
      setItem: jest.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((key) => {
          delete store[key];
        });
      }),
    };
  });
  afterAll(() => {
    global.fetch = originalFetch;
    global.localStorage = originalLocalStorage;
  });
  test("makes GET request without token if none available", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true, data: { items: [] } }),
    });
    const result = await api.get("/products");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/products"),
      { method: "GET", headers: { "Content-Type": "application/json" } },
    );
    expect(result).toEqual({ items: [] });
  });
  test("uses token from localStorage when getter is not provided", async () => {
    global.localStorage.setItem("shopsphere_token", "stored-token-123");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ id: 1, name: "Item" }),
    });
    const result = await api.get("/items/1");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/items/1"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer stored-token-123",
        }),
      }),
    );
    expect(result).toEqual({ id: 1, name: "Item" });
  });
  test("uses configured access token getter over localStorage", async () => {
    global.localStorage.setItem("accessToken", "local-token");
    configureAccessTokenGetter(jest.fn().mockResolvedValue("getter-token-456"));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true, data: "ok" }),
    });
    const result = await api.get("/user/profile");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/user/profile"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer getter-token-456",
        }),
      }),
    );
    expect(result).toBe("ok");
  });
  test("falls back to localStorage if access token getter throws", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    global.localStorage.setItem("shopsphere_token", "fallback-token");
    configureAccessTokenGetter(
      jest.fn().mockRejectedValue(new Error("Getter failed")),
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ test: true }),
    });
    const result = await api.get("/test");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer fallback-token",
        }),
      }),
    );
    expect(result).toEqual({ test: true });
    consoleError.mockRestore();
  });
  test("makes POST request with stringified body", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: jest
        .fn()
        .mockResolvedValue({ success: true, data: { id: "new-1" } }),
    });
    const body = { name: "New Product", price: 100 };
    const result = await api.post("/products", body);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/products"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    expect(result).toEqual({ id: "new-1" });
  });
  test("makes PUT request with body", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ updated: true }),
    });
    const result = await api.put("/products/1", { price: 120 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/products/1"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ price: 120 }),
      }),
    );
    expect(result).toEqual({ updated: true });
  });
  test("makes PATCH request with body", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest
        .fn()
        .mockResolvedValue({ success: true, data: { patched: true } }),
    });
    const result = await api.patch("/orders/1", { status: "DELIVERED" });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/orders/1"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "DELIVERED" }),
      }),
    );
    expect(result).toEqual({ patched: true });
  });
  test("makes DELETE request", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ deleted: true }),
    });
    const result = await api.delete("/cart/items/5");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/cart/items/5"),
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(result).toEqual({ deleted: true });
  });
  test("throws network error when fetch fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Connection refused"));
    await expect(api.get("/fail")).rejects.toThrow("Connection refused");
  });
  test("throws structured error on non-ok response with JSON error body", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        message: "Validation failed",
        errors: ["Invalid email"],
      }),
    });
    await expect(api.post("/fail", {})).rejects.toMatchObject({
      message: "Validation failed",
      status: 400,
      data: { message: "Validation failed", errors: ["Invalid email"] },
    });
    consoleError.mockRestore();
  });
  test("handles empty/non-JSON response gracefully on non-ok", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: jest
        .fn()
        .mockRejectedValue(new Error("Unexpected end of JSON input")),
    });
    await expect(api.get("/server-error")).rejects.toMatchObject({
      message: "Request failed with status 500",
      status: 500,
    });
    consoleError.mockRestore();
  });
});
