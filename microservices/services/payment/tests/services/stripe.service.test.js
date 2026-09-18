describe("stripe.service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();

    process.env = {
      ...originalEnv,
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("returns null when Stripe key is missing", () => {
    delete process.env.STRIPE_SECRET_KEY;

    jest.mock("stripe", () => jest.fn());

    const stripe = require("../../src/services/stripe.service");

    expect(stripe).toBeNull();
  });

  test("creates Stripe client when key exists", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_example";

    const mockStripe = jest.fn(() => ({
      checkout: {},
    }));

    jest.mock("stripe", () => mockStripe);

    const stripe = require("../../src/services/stripe.service");

    expect(mockStripe).toHaveBeenCalledWith(
      "sk_test_example",
    );

    expect(stripe).toEqual({
      checkout: {},
    });
  });
});

// describe("stripe.service",()=>{const old=process.env;beforeEach(()=>{jest.resetModules();process.env={...old}});afterAll(()=>process.env=old);test("null without key",()=>{delete process.env.STRIPE_SECRET_KEY;jest.mock("stripe",()=>jest.fn());expect(require("../../src/services/stripe.service")).toBeNull()});test("creates client",()=>{process.env.STRIPE_SECRET_KEY="sk_test";const Stripe=jest.fn(()=>({checkout:{}}));jest.mock("stripe",()=>Stripe);const s=require("../../src/services/stripe.service");expect(Stripe).toHaveBeenCalledWith("sk_test");expect(s).toEqual({checkout:{}})})});
