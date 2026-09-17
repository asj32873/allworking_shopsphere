const controller = require("../../src/controllers/order.controller");

const Order = require("../../src/models/Order");
const OrderItem = require("../../src/models/OrderItem");
const History = require("../../src/models/OrderStatusHistory");

const {
  getJson,
  postJson,
} = require("../../src/utils/serviceClient");

const {
  ok,
  fail,
} = require("../../src/utils/apiResponse");

jest.mock("../../src/models/Order", () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../../src/models/OrderItem", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  insertMany: jest.fn(),
  exists: jest.fn(),
}));

jest.mock("../../src/models/OrderStatusHistory", () => ({
  find: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
  postJson: jest.fn(),
}));

jest.mock("../../src/utils/apiResponse", () => ({
  ok: jest.fn((res, data, message = "OK", status = 200) => {
    return res.status(status).json({
      success: true,
      message,
      data,
    });
  }),

  fail: jest.fn((res, message, status = 400) => {
    return res.status(status).json({
      success: false,
      message,
    });
  }),
}));

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function createRequest(overrides = {}) {
  return {
    params: {},
    body: {},
    user: {
      id: "user-123",
      role: "USER",
    },
    auth: {
      id: "user-123",
    },
    ...overrides,
  };
}

function mockQuery(value) {
  return {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(value),
  };
}

describe("order.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.CART_SERVICE_URL =
      "http://localhost:5004";

    process.env.PRODUCT_SERVICE_URL =
      "http://localhost:5003";

    process.env.ADDRESS_SERVICE_URL =
      "http://localhost:5008";
  });

  describe("createOrder", () => {
    test("creates order successfully", async () => {
      const order = {
        _id: "order-123",
        userId: "user-123",
        addressId: "address-123",
        totalAmount: 300,
      };

      const items = [
        {
          productId: "product-1",
          vendorId: "vendor-1",
          name: "Phone",
          quantity: 2,
          unitPrice: 150,
        },
      ];

      const docs = [
        {
          ...items[0],
          orderId: "order-123",
        },
      ];

      getJson
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: {
              id: "address-123",
            },
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [
              {
                productId: "product-1",
                quantity: 2,
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: {
              _id: "product-1",
              vendorId: "vendor-1",
              name: "Phone",
              price: 150,
              stock: 5,
            },
          },
        });

      postJson
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          data: {
            success: true,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      Order.create.mockResolvedValue(order);
      OrderItem.insertMany.mockResolvedValue(docs);
      History.create.mockResolvedValue({});

      const req = createRequest({
        body: {
          addressId: "address-123",
        },
      });

      const res = createResponse();

      await controller.createOrder(req, res);

      expect(Order.create).toHaveBeenCalledWith({
        userId: "user-123",
        addressId: "address-123",
        totalAmount: 300,
        paymentStatus: "PAID",
        paymentMethod: "STRIPE_TEST",
      });

      expect(OrderItem.insertMany).toHaveBeenCalled();

      expect(History.create).toHaveBeenCalledWith({
        orderId: "order-123",
        status: "PLACED",
        updatedBy: "user-123",
        remarks: "Order created",
      });

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("returns 404 when address does not exist", async () => {
      getJson.mockResolvedValueOnce({
        ok: false,
      });

      const req = createRequest({
        body: {
          addressId: "missing-address",
        },
      });

      const res = createResponse();

      await controller.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Delivery address not found.",
      });

      expect(Order.create).not.toHaveBeenCalled();
    });

    test("returns 400 when cart is empty", async () => {
      getJson
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [],
          },
        });

      const req = createRequest({
        body: {
          addressId: "address-123",
        },
      });

      const res = createResponse();

      await controller.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Cart is empty.",
      });
    });

    test("returns 409 when product no longer exists", async () => {
      getJson
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [
              {
                productId: "product-1",
                quantity: 1,
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {},
        });

      const req = createRequest({
        body: {
          addressId: "address-123",
        },
      });

      const res = createResponse();

      await controller.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(409);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          "A product in your cart no longer exists.",
      });
    });

    test("returns 409 when product stock is insufficient", async () => {
      getJson
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [
              {
                productId: "product-1",
                quantity: 5,
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: {
              _id: "product-1",
              name: "Phone",
              stock: 2,
              price: 100,
              vendorId: "vendor-1",
            },
          },
        });

      const req = createRequest({
        body: {
          addressId: "address-123",
        },
      });

      const res = createResponse();

      await controller.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(409);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          "Only 2 item(s) of Phone are available.",
      });
    });

    test("returns reservation service response when reservation fails", async () => {
      getJson
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [
              {
                productId: "product-1",
                quantity: 1,
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: {
              _id: "product-1",
              name: "Phone",
              stock: 5,
              price: 100,
              vendorId: "vendor-1",
            },
          },
        });

      postJson.mockResolvedValueOnce({
        ok: false,
        status: 409,
        data: {
          success: false,
          message: "Unable to reserve stock.",
        },
      });

      const req = createRequest({
        body: {
          addressId: "address-123",
        },
      });

      const res = createResponse();

      await controller.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(409);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Unable to reserve stock.",
      });

      expect(Order.create).not.toHaveBeenCalled();
    });

    test("releases products when order creation fails", async () => {
      getJson
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [
              {
                productId: "product-1",
                quantity: 1,
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: {
              _id: "product-1",
              name: "Phone",
              stock: 5,
              price: 100,
              vendorId: "vendor-1",
            },
          },
        });

      postJson
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      Order.create.mockRejectedValue(
        new Error("Database failure"),
      );

      const req = createRequest({
        body: {
          addressId: "address-123",
        },
      });

      const res = createResponse();

      await expect(
        controller.createOrder(req, res),
      ).rejects.toThrow("Database failure");

      expect(postJson).toHaveBeenLastCalledWith(
        "http://localhost:5003",
        "/internal/products/release",
        {
          items: [
            {
              productId: "product-1",
              vendorId: "vendor-1",
              name: "Phone",
              quantity: 1,
              unitPrice: 100,
            },
          ],
        },
      );
    });
  });

  describe("listMyOrders", () => {
    test("returns orders with items and tracking", async () => {
      const order = {
        _id: {
          toString: () => "order-1",
        },
        userId: "user-123",
      };

      const item = {
        _id: {
          toString: () => "item-1",
        },
        orderId: {
          toString: () => "order-1",
        },
        name: "Phone",
      };

      const history = {
        orderItemId: {
          toString: () => "item-1",
        },
        status: "DELIVERED",
        timestamp: "2026-09-16",
        remarks: "Delivered",
      };

      Order.find.mockReturnValue(
        mockQuery([order]),
      );

      OrderItem.find.mockReturnValue(
        mockQuery([item]),
      );

      History.find.mockReturnValue(
        mockQuery([history]),
      );

      const req = createRequest();
      const res = createResponse();

      await controller.listMyOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Orders fetched successfully.",
        }),
      );
    });

    test("returns 401 when authenticated user id is missing", async () => {
      const req = createRequest({
        auth: undefined,
        user: {},
      });

      const res = createResponse();

      await controller.listMyOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("returns 500 when database query fails", async () => {
      Order.find.mockImplementation(() => {
        throw new Error("query failed");
      });

      const req = createRequest();
      const res = createResponse();

      await controller.listMyOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "query failed",
      });
    });
  });

  describe("getById", () => {
    test("returns order with items and tracking", async () => {
      const order = {
        _id: {
          toString: () => "order-1",
        },
        userId: {
          toString: () => "user-123",
        },
      };

      const item = {
        _id: {
          toString: () => "item-1",
        },
        orderId: order._id,
      };

      const history = {
        orderItemId: item._id,
        status: "PACKED",
        timestamp: "2026-09-16",
        remarks: "Packed",
      };

      Order.findById.mockReturnValue(
        mockQuery(order),
      );

      OrderItem.find.mockReturnValue(
        mockQuery([item]),
      );

      History.find.mockReturnValue(
        mockQuery([history]),
      );

      const req = createRequest({
        params: {
          id: "order-1",
        },
      });

      const res = createResponse();

      await controller.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 404 when order does not exist", async () => {
      Order.findById.mockReturnValue(
        mockQuery(null),
      );

      const req = createRequest({
        params: {
          id: "missing-order",
        },
      });

      const res = createResponse();

      await controller.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns 404 when USER does not own order", async () => {
      const order = {
        _id: {
          toString: () => "order-1",
        },
        userId: {
          toString: () => "different-user",
        },
      };

      Order.findById.mockReturnValue(
        mockQuery(order),
      );

      const req = createRequest({
        params: {
          id: "order-1",
        },
        user: {
          id: "user-123",
          role: "USER",
        },
      });

      const res = createResponse();

      await controller.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("tracking", () => {
    test("returns order tracking history", async () => {
      const order = {
        _id: "order-1",
        userId: {
          toString: () => "user-123",
        },
      };

      Order.findById.mockReturnValue(
        mockQuery(order),
      );

      History.find.mockReturnValue(
        mockQuery([
          {
            status: "PLACED",
          },
        ]),
      );

      const req = createRequest({
        params: {
          id: "order-1",
        },
      });

      const res = createResponse();

      await controller.tracking(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 404 when order does not exist", async () => {
      Order.findById.mockReturnValue(
        mockQuery(null),
      );

      const req = createRequest({
        params: {
          id: "missing",
        },
      });

      const res = createResponse();

      await controller.tracking(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns 404 when USER does not own order", async () => {
      Order.findById.mockReturnValue(
        mockQuery({
          _id: "order-1",
          userId: {
            toString: () => "other-user",
          },
        }),
      );

      const req = createRequest({
        params: {
          id: "order-1",
        },
        user: {
          id: "user-123",
          role: "USER",
        },
      });

      const res = createResponse();

      await controller.tracking(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("vendorList", () => {
    test("returns vendor orders", async () => {
      const items = [
        {
          orderId: {
            toString: () => "order-1",
          },
        },
      ];

      const orders = [
        {
          _id: {
            toString: () => "order-1",
          },
        },
      ];

      OrderItem.find.mockReturnValue(
        mockQuery(items),
      );

      Order.find.mockReturnValue(
        mockQuery(orders),
      );

      const req = createRequest({
        user: {
          id: "vendor-1",
          role: "VENDOR",
        },
      });

      const res = createResponse();

      await controller.vendorList(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("vendorUpdateStatus", () => {
    test("updates vendor item status", async () => {
      const item = {
        _id: "item-1",
        orderId: "order-1",
        vendorStatus: "PLACED",
        save: jest.fn().mockResolvedValue(),
      };

      OrderItem.findOne.mockResolvedValue(item);
      History.create.mockResolvedValue({});
      OrderItem.find.mockReturnValue(
        mockQuery([
          {
            vendorStatus: "CONFIRMED",
          },
        ]),
      );

      Order.findByIdAndUpdate.mockResolvedValue({});

      const req = createRequest({
        user: {
          id: "vendor-1",
          role: "VENDOR",
        },
        params: {
          orderId: "order-1",
          itemId: "item-1",
        },
        body: {
          status: "CONFIRMED",
          remarks: "Confirmed",
        },
      });

      const res = createResponse();

      await controller.vendorUpdateStatus(req, res);

      expect(item.vendorStatus).toBe("CONFIRMED");
      expect(item.save).toHaveBeenCalled();

      expect(History.create).toHaveBeenCalledWith({
        orderId: "order-1",
        orderItemId: "item-1",
        status: "CONFIRMED",
        updatedBy: "vendor-1",
        remarks: "Confirmed",
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 404 when vendor item is not found", async () => {
      OrderItem.findOne.mockResolvedValue(null);

      const req = createRequest({
        user: {
          id: "vendor-1",
          role: "VENDOR",
        },
        params: {
          orderId: "order-1",
          itemId: "missing",
        },
        body: {
          status: "CONFIRMED",
        },
      });

      const res = createResponse();

      await controller.vendorUpdateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("adminList", () => {
    test("returns all orders with items", async () => {
      const orders = [
        {
          _id: {
            toString: () => "order-1",
          },
        },
      ];

      const items = [
        {
          _id: {
            toString: () => "item-1",
          },
          orderId: {
            toString: () => "order-1",
          },
        },
      ];

      Order.find.mockReturnValue(
        mockQuery(orders),
      );

      OrderItem.find.mockReturnValue(
        mockQuery(items),
      );

      const req = createRequest({
        user: {
          id: "admin-1",
          role: "ADMIN",
        },
      });

      const res = createResponse();

      await controller.adminList(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 500 when admin order query fails", async () => {
      Order.find.mockImplementation(() => {
        throw new Error("query failed");
      });

      const req = createRequest();
      const res = createResponse();

      await controller.adminList(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to fetch orders.",
      });
    });
  });

  describe("adminUpdateStatus", () => {
    test("updates admin item status", async () => {
      const item = {
        _id: "item-1",
        orderId: "order-1",
        vendorStatus: "PLACED",
        save: jest.fn().mockResolvedValue(),
      };

      OrderItem.findOne.mockResolvedValue(item);

      History.create.mockResolvedValue({});

      OrderItem.find.mockReturnValue(
        mockQuery([
          {
            vendorStatus: "DELIVERED",
          },
        ]),
      );

      Order.findByIdAndUpdate.mockResolvedValue({});

      const req = createRequest({
        user: {
          id: "admin-1",
          role: "ADMIN",
        },
        params: {
          orderId: "order-1",
          itemId: "item-1",
        },
        body: {
          status: "DELIVERED",
          remarks: "Delivered",
        },
      });

      const res = createResponse();

      await controller.adminUpdateStatus(req, res);

      expect(item.vendorStatus).toBe("DELIVERED");
      expect(item.save).toHaveBeenCalled();

      expect(History.create).toHaveBeenCalledWith({
        orderId: "order-1",
        orderItemId: "item-1",
        status: "DELIVERED",
        updatedBy: "admin-1",
        remarks: "Delivered",
      });

      expect(
        Order.findByIdAndUpdate,
      ).toHaveBeenCalledWith(
        "order-1",
        {
          status: "DELIVERED",
        },
      );
    });

    test("returns 404 when item does not exist", async () => {
      OrderItem.findOne.mockResolvedValue(null);

      const req = createRequest({
        user: {
          id: "admin-1",
          role: "ADMIN",
        },
        params: {
          orderId: "order-1",
          itemId: "missing",
        },
        body: {
          status: "CONFIRMED",
        },
      });

      const res = createResponse();

      await controller.adminUpdateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("refreshOrderStatus through adminUpdateStatus", () => {
    test.each([
      ["DELIVERED", ["DELIVERED"]],
      ["OUT_FOR_DELIVERY", ["OUT_FOR_DELIVERY"]],
      ["DISPATCHED", ["DISPATCHED"]],
      ["PACKED", ["PACKED"]],
      ["CONFIRMED", ["CONFIRMED"]],
      ["CANCELLED", ["CANCELLED"]],
      ["PLACED", ["PLACED"]],
    ])(
      "maps %s item statuses to order status",
      async (expected, statuses) => {
        const item = {
          _id: "item-1",
          orderId: "order-1",
          vendorStatus: "PLACED",
          save: jest.fn().mockResolvedValue(),
        };

        OrderItem.findOne.mockResolvedValue(item);

        History.create.mockResolvedValue({});

        OrderItem.find.mockReturnValue(
          mockQuery(
            statuses.map((status) => ({
              vendorStatus: status,
            })),
          ),
        );

        Order.findByIdAndUpdate.mockResolvedValue({});

        const req = createRequest({
          user: {
            id: "admin-1",
            role: "ADMIN",
          },
          params: {
            orderId: "order-1",
            itemId: "item-1",
          },
          body: {
            status: expected,
          },
        });

        const res = createResponse();

        await controller.adminUpdateStatus(
          req,
          res,
        );

        expect(
          Order.findByIdAndUpdate,
        ).toHaveBeenCalledWith(
          "order-1",
          {
            status: expected,
          },
        );
      },
    );
  });

  describe("internalCreatePaid", () => {
    test("creates paid order from payment service", async () => {
      const order = {
        _id: "order-1",
      };

      const items = [
        {
          productId: "product-1",
          vendorId: "vendor-1",
          name: "Phone",
          quantity: 1,
          unitPrice: 100,
        },
      ];

      Order.create.mockResolvedValue(order);

      OrderItem.insertMany.mockResolvedValue([
        {
          ...items[0],
          orderId: "order-1",
        },
      ]);

      History.create.mockResolvedValue({});

      const req = createRequest({
        body: {
          userId: "user-1",
          addressId: "address-1",
          totalAmount: 100,
          items,
          stripeSessionId: "session-1",
          stripePaymentIntentId: "intent-1",
        },
      });

      const res = createResponse();

      await controller.internalCreatePaid(
        req,
        res,
      );

      expect(Order.create).toHaveBeenCalledWith({
        userId: "user-1",
        addressId: "address-1",
        totalAmount: 100,
        paymentStatus: "PAID",
        paymentMethod: "STRIPE_TEST",
        stripeSessionId: "session-1",
        stripePaymentIntentId: "intent-1",
      });

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("internalReviewEligibility", () => {
    test("returns eligible when delivered order contains product", async () => {
      Order.find.mockReturnValue({
        distinct: jest
          .fn()
          .mockResolvedValue(["order-1"]),
      });

      OrderItem.exists.mockResolvedValue(true);

      const req = createRequest({
        params: {
          userId: "user-1",
          productId: "product-1",
        },
      });

      const res = createResponse();

      await controller.internalReviewEligibility(
        req,
        res,
      );

      expect(OrderItem.exists).toHaveBeenCalledWith({
        orderId: {
          $in: ["order-1"],
        },
        productId: "product-1",
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: {
          eligible: true,
        },
      });
    });

    test("returns false when product is not eligible", async () => {
      Order.find.mockReturnValue({
        distinct: jest
          .fn()
          .mockResolvedValue([]),
      });

      OrderItem.exists.mockResolvedValue(false);

      const req = createRequest({
        params: {
          userId: "user-1",
          productId: "product-1",
        },
      });

      const res = createResponse();

      await controller.internalReviewEligibility(
        req,
        res,
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: {
          eligible: false,
        },
      });
    });
  });

  describe("internalVendorOrders", () => {
    test("returns order ids for vendor", async () => {
      OrderItem.find.mockReturnValue({
        distinct: jest
          .fn()
          .mockResolvedValue([
            "order-1",
            "order-2",
          ]),
      });

      const req = createRequest({
        params: {
          vendorId: "vendor-1",
        },
      });

      const res = createResponse();

      await controller.internalVendorOrders(
        req,
        res,
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: [
          "order-1",
          "order-2",
        ],
      });
    });
  });

  describe("internalVendorItems", () => {
    test("returns vendor items", async () => {
      const items = [
        {
          _id: "item-1",
          vendorId: "vendor-1",
        },
      ];

      OrderItem.find.mockReturnValue({
        lean: jest
          .fn()
          .mockResolvedValue(items),
      });

      const req = createRequest({
        params: {
          vendorId: "vendor-1",
        },
      });

      const res = createResponse();

      await controller.internalVendorItems(
        req,
        res,
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: items,
      });
    });
  });
});