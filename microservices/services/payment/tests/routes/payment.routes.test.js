jest.mock("../../src/controllers/payment.controller", () => ({
  debug: jest.fn((req, res) =>
    res.json({
      route: "debug",
    }),
  ),

  createCheckoutSession: jest.fn((req, res) =>
    res.json({
      route: "checkout",
    }),
  ),
}));

jest.mock("../../src/middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => next()),

  authorize: jest.fn(() => {
    return (req, res, next) => next();
  }),
}));

const express = require("express");
const request = require("supertest");

const controller = require("../../src/controllers/payment.controller");
const router = require("../../src/routes");

const app = express();

app.use(express.json());
app.use("/", router);

describe("payment routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /api/payments/debug", async () => {
    const response = await request(app)
      .post("/api/payments/debug")
      .expect(200);

    expect(response.body).toEqual({
      route: "debug",
    });

    expect(controller.debug).toHaveBeenCalled();
  });

  test("POST /api/payments/create-checkout-session", async () => {
    const response = await request(app)
      .post("/api/payments/create-checkout-session")
      .send({
        addressId: "address-1",
      })
      .expect(200);

    expect(response.body).toEqual({
      route: "checkout",
    });

    expect(controller.createCheckoutSession)
      .toHaveBeenCalled();
  });
});

// jest.mock("../../src/controllers/payment.controller",()=>({debug:jest.fn((q,r)=>r.json({route:"debug"})),createCheckoutSession:jest.fn((q,r)=>r.json({route:"checkout"}))}));
// jest.mock("../../src/middleware/auth",()=>({authenticate:jest.fn((q,r,n)=>n()),authorize:jest.fn(()=>((q,r,n)=>n()))}));
// const express=require("express"),request=require("supertest"),c=require("../../src/controllers/payment.controller"),a=require("../../src/middleware/auth"),router=require("../../src/routes");const app=express();app.use(express.json());app.use("/",router);
// describe("routes",()=>{test("debug",async()=>{await request(app).post("/api/payments/debug").expect(200);expect(c.debug).toHaveBeenCalled()});test("checkout middleware/controller",async()=>{await request(app).post("/api/payments/create-checkout-session").send({addressId:"a"}).expect(200);expect(a.authenticate).toHaveBeenCalled();expect(a.authorize).toHaveBeenCalledWith("USER");expect(c.createCheckoutSession).toHaveBeenCalled()})});
