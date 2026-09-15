const CartItem = require("../../src/models/CartItem");
const controller = require("../../src/controllers/cart.controller");
const { getJson } = require("../../src/utils/serviceClient");

jest.mock("../../src/models/CartItem", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
  create: jest.fn(),
  deleteMany: jest.fn(),
}));

jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
}));

jest.mock("../../src/utils/apiResponse", () => ({
  ok: jest.fn((res, data, message = "OK", status = 200) =>
    res.status(status).json({ success: true, message, data }),
  ),
  fail: jest.fn((res, message, status = 400) =>
    res.status(status).json({ success: false, message }),
  ),
}));

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function userRequest(overrides = {}) {
  return {
    auth: { id: "user-123" },
    ...overrides,
  };
}

describe("cart.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PRODUCT_SERVICE_URL = "http://localhost:5003";
  });

  describe("getCart", () => {
    test("returns cart items with product information", async () => {
      const items = [
        {
          _id: "cart-1",
          userId: "user-123",
          productId: "product-1",
          quantity: 2,
        },
      ];

      CartItem.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(items),
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            _id: "product-1",
            name: "Phone",
            price: 500,
            stock: 5,
          },
        },
      });

      const req = userRequest();
      const res = createResponse();

      await controller.getCart(req, res);

      expect(CartItem.find).toHaveBeenCalledWith({ userId: "user-123" });
      expect(getJson).toHaveBeenCalledWith(
        "http://localhost:5003",
        "/internal/products/product-1",
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: [
          {
            id: "cart-1",
            productId: "product-1",
            quantity: 2,
            product: {
              _id: "product-1",
              name: "Phone",
              price: 500,
              stock: 5,
            },
            subtotal: 1000,
            availableStock: 5,
            available: true,
            status: "AVAILABLE",
          },
        ],
      });
    });

    test("marks item unavailable when product does not exist", async () => {
      const items = [
        {
          _id: "cart-1",
          productId: "missing-product",
          quantity: 2,
        },
      ];

      CartItem.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(items),
      });

      getJson.mockResolvedValue({
        ok: false,
        data: null,
      });

      const res = createResponse();

      await controller.getCart(userRequest(), res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: [
          {
            id: "cart-1",
            productId: null,
            quantity: 2,
            product: null,
            subtotal: 0,
            availableStock: 0,
            available: false,
            status: "PRODUCT_UNAVAILABLE",
          },
        ],
      });
    });

    test("reports out of stock", async () => {
      CartItem.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: "cart-1", productId: "product-1", quantity: 1 },
        ]),
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            _id: "product-1",
            price: 100,
            stock: 0,
          },
        },
      });

      const res = createResponse();

      await controller.getCart(userRequest(), res);

      expect(res.json.mock.calls[0][0].data[0].status).toBe("OUT_OF_STOCK");
      expect(res.json.mock.calls[0][0].data[0].available).toBe(false);
    });

    test("reports insufficient stock", async () => {
      CartItem.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: "cart-1", productId: "product-1", quantity: 5 },
        ]),
      });

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            _id: "product-1",
            price: 100,
            stock: 2,
          },
        },
      });

      const res = createResponse();

      await controller.getCart(userRequest(), res);

      expect(res.json.mock.calls[0][0].data[0].status).toBe(
        "INSUFFICIENT_STOCK",
      );
      expect(res.json.mock.calls[0][0].data[0].subtotal).toBe(500);
    });
  });

  describe("add", () => {
    test("rejects missing productId", async () => {
      const req = userRequest({ body: { quantity: 1 } });
      const res = createResponse();

      await controller.add(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(getJson).not.toHaveBeenCalled();
      expect(CartItem.create).not.toHaveBeenCalled();
    });

    test("rejects non-positive or non-integer quantity", async () => {
      const res = createResponse();

      await controller.add(
        userRequest({ body: { productId: "product-1", quantity: 1.5 } }),
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(getJson).not.toHaveBeenCalled();
    });

    test("returns 404 when product does not exist", async () => {
      getJson.mockResolvedValue({ ok: false, data: null });

      const res = createResponse();

      await controller.add(
        userRequest({ body: { productId: "product-1", quantity: 1 } }),
        res,
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Product not found.",
      });
    });

    test("creates a new cart item", async () => {
      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            _id: "product-1",
            price: 100,
            stock: 10,
          },
        },
      });

      CartItem.findOne.mockResolvedValue(null);
      CartItem.create.mockResolvedValue({
        _id: "cart-1",
        userId: "user-123",
        productId: "product-1",
        quantity: 2,
      });

      const res = createResponse();

      await controller.add(
        userRequest({ body: { productId: "product-1", quantity: 2 } }),
        res,
      );

      expect(CartItem.create).toHaveBeenCalledWith({
        userId: "user-123",
        productId: "product-1",
        quantity: 2,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("defaults quantity to 1", async () => {
      getJson.mockResolvedValue({
        ok: true,
        data: { data: { _id: "product-1", stock: 10 } },
      });
      CartItem.findOne.mockResolvedValue(null);
      CartItem.create.mockResolvedValue({ quantity: 1 });

      const res = createResponse();

      await controller.add(
        userRequest({ body: { productId: "product-1" } }),
        res,
      );

      expect(CartItem.create).toHaveBeenCalledWith({
        userId: "user-123",
        productId: "product-1",
        quantity: 1,
      });
    });

    test("returns 409 when new quantity exceeds stock", async () => {
      getJson.mockResolvedValue({
        ok: true,
        data: { data: { _id: "product-1", stock: 2 } },
      });

      CartItem.findOne.mockResolvedValue(null);

      const res = createResponse();

      await controller.add(
        userRequest({ body: { productId: "product-1", quantity: 3 } }),
        res,
      );

      expect(res.status).toHaveBeenCalledWith(409);
      expect(CartItem.create).not.toHaveBeenCalled();
    });

    test("increments an existing cart item", async () => {
      getJson.mockResolvedValue({
        ok: true,
        data: { data: { _id: "product-1", stock: 10 } },
      });

      const item = {
        quantity: 2,
        save: jest.fn().mockResolvedValue(true),
      };

      CartItem.findOne.mockResolvedValue(item);

      const res = createResponse();

      await controller.add(
        userRequest({ body: { productId: "product-1", quantity: 3 } }),
        res,
      );

      expect(item.quantity).toBe(5);
      expect(item.save).toHaveBeenCalled();
    });

    test("returns 409 when existing quantity plus requested quantity exceeds stock", async () => {
      getJson.mockResolvedValue({
        ok: true,
        data: { data: { _id: "product-1", stock: 4 } },
      });

      const item = {
        quantity: 3,
        save: jest.fn(),
      };

      CartItem.findOne.mockResolvedValue(item);

      const res = createResponse();

      await controller.add(
        userRequest({ body: { productId: "product-1", quantity: 2 } }),
        res,
      );

      expect(res.status).toHaveBeenCalledWith(409);
      expect(item.save).not.toHaveBeenCalled();
      expect(item.quantity).toBe(3);
    });
  });

  describe("update", () => {
    test("rejects invalid quantity", async () => {
      const res = createResponse();

      await controller.update(
        userRequest({
          params: { id: "cart-1" },
          body: { quantity: 0 },
        }),
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(CartItem.findOne).not.toHaveBeenCalled();
    });

    test("returns 404 when cart item is not found", async () => {
      CartItem.findOne.mockResolvedValue(null);

      const res = createResponse();

      await controller.update(
        userRequest({
          params: { id: "missing" },
          body: { quantity: 2 },
        }),
        res,
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns 404 when product is not found", async () => {
      CartItem.findOne.mockResolvedValue({
        productId: "product-1",
      });

      getJson.mockResolvedValue({ ok: false, data: null });

      const res = createResponse();

      await controller.update(
        userRequest({
          params: { id: "cart-1" },
          body: { quantity: 2 },
        }),
        res,
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns 409 when requested quantity exceeds stock", async () => {
      CartItem.findOne.mockResolvedValue({
        productId: "product-1",
      });

      getJson.mockResolvedValue({
        ok: true,
        data: { data: { _id: "product-1", stock: 1 } },
      });

      const res = createResponse();

      await controller.update(
        userRequest({
          params: { id: "cart-1" },
          body: { quantity: 2 },
        }),
        res,
      );

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test("updates quantity successfully", async () => {
      const item = {
        productId: "product-1",
        quantity: 1,
        save: jest.fn().mockResolvedValue(true),
      };

      CartItem.findOne.mockResolvedValue(item);

      getJson.mockResolvedValue({
        ok: true,
        data: { data: { _id: "product-1", stock: 5 } },
      });

      const res = createResponse();

      await controller.update(
        userRequest({
          params: { id: "cart-1" },
          body: { quantity: 4 },
        }),
        res,
      );

      expect(item.quantity).toBe(4);
      expect(item.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("remove", () => {
    test("removes a cart item", async () => {
      CartItem.findOneAndDelete.mockResolvedValue({
        _id: "cart-1",
      });

      const res = createResponse();

      await controller.remove(
        userRequest({ params: { id: "cart-1" } }),
        res,
      );

      expect(CartItem.findOneAndDelete).toHaveBeenCalledWith({
        userId: "user-123",
        _id: "cart-1",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 404 when cart item does not exist", async () => {
      CartItem.findOneAndDelete.mockResolvedValue(null);

      const res = createResponse();

      await controller.remove(
        userRequest({ params: { id: "missing" } }),
        res,
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("clear", () => {
    test("clears the authenticated user's cart", async () => {
      CartItem.deleteMany.mockResolvedValue({ deletedCount: 2 });

      const res = createResponse();

      await controller.clear(userRequest(), res);

      expect(CartItem.deleteMany).toHaveBeenCalledWith({
        userId: "user-123",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("internalCart", () => {
    test("returns cart items for requested user", async () => {
      const items = [{ _id: "cart-1", userId: "user-123" }];

      CartItem.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(items),
      });

      const res = createResponse();

      await controller.internalCart(
        { params: { userId: "user-123" } },
        res,
      );

      expect(CartItem.find).toHaveBeenCalledWith({
        userId: "user-123",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("internalClear", () => {
    test("clears cart for requested user", async () => {
      CartItem.deleteMany.mockResolvedValue({ deletedCount: 1 });

      const res = createResponse();

      await controller.internalClear(
        { params: { userId: "user-123" } },
        res,
      );

      expect(CartItem.deleteMany).toHaveBeenCalledWith({
        userId: "user-123",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
