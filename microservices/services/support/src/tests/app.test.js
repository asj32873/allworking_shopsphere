const request = require("supertest");
const app = require("../app");

describe("support app", () => {
  test("health endpoint returns support service status", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe("shopsphere-support");
    expect(res.body.timestamp).toEqual(expect.any(String));
  });

  test("unknown route reaches notFound handler", async () => {
    const res = await request(app).get("/does-not-exist");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Authentication required.");
  });
});
