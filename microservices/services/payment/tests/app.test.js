jest.mock("@shopsphere/common", () => ({
  requestId: (req, res, next) => {
    req.requestId = "test-request";
    next();
  },

  notFound: (req, res) =>
    res.status(404).json({
      success: false,
      message: "Not found",
    }),

  errorHandler: (err, req, res, next) =>
    res.status(500).json({
      success: false,
      message: err.message,
    }),
}));

const request = require("supertest");
// const app = require("../../src/app");

const app = require("../src/app");

describe("payment app", () => {
  test("GET /health", async () => {
    const response = await request(app)
      .get("/health")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.service).toBe(
      "shopsphere-payment",
    );
    expect(response.body.timestamp).toEqual(
      expect.any(String),
    );
  });

  test("unknown route returns 404", async () => {
    const response = await request(app)
      .get("/does-not-exist")
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      message: "Not found",
    });
  });
});


// jest.mock("../../src/controllers/payment.controller",()=>({debug:jest.fn((q,r)=>r.json({success:true,message:"Payment router works"})),createCheckoutSession:jest.fn(),webhook:jest.fn((q,r)=>r.json({received:true}))}));
// jest.mock("../../src/middleware/auth",()=>({authenticate:jest.fn((q,r,n)=>n()),authorize:jest.fn(()=>((q,r,n)=>n()))}));
// jest.mock("@shopsphere/common",()=>({requestId:(q,r,n)=>n(),notFound:(q,r)=>r.status(404).json({success:false,message:"Not found"}),errorHandler:(e,q,r,n)=>r.status(500).json({success:false,message:e.message})}));
// const request=require("supertest"),app=require("../../src/app");
// describe("app",()=>{test("health",async()=>{const r=await request(app).get("/health").expect(200);expect(r.body.success).toBe(true);expect(r.body.service).toBe("shopsphere-payment");expect(r.body.timestamp).toEqual(expect.any(String))});test("debug",async()=>{const r=await request(app).post("/api/payments/debug").expect(200);expect(r.body.message).toBe("Payment router works")});test("404",async()=>{await request(app).get("/unknown").expect(404)})});
