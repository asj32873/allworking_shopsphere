jest.mock("../../src/models/Vendor", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));
jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
}));
jest.mock("../../src/utils/apiResponse", () => ({
  ok: jest.fn((res, data, message = "OK", status = 200) => {
    res.status(status).json({ success: true, message, data });
  }),
  fail: jest.fn((res, message, status = 400) => {
    res.status(status).json({ success: false, message });
  }),
}));

const Vendor = require("../../src/models/Vendor");
const { getJson } = require("../../src/utils/serviceClient");
const { ok, fail } = require("../../src/utils/apiResponse");
const controller = require("../../src/controllers/vendor.controller");

function resMock() {
  const res = { status: jest.fn() };
  res.status.mockImplementation(() => ({ json: jest.fn() }));
  return res;
}

function chain(value) {
  return {
    lean: jest.fn().mockResolvedValue(value),
    sort: jest.fn().mockReturnThis(),
  };
}

describe("vendor.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.PRODUCT_SERVICE_URL;
    delete process.env.ORDER_SERVICE_URL;
    delete process.env.SUPPORT_SERVICE_URL;
  });

  describe("profile", () => {
    test("returns 401 when authenticated user id is missing", async () => {
      const res = resMock();
      await controller.profile({ auth: {} }, res);
      expect(fail).toHaveBeenCalledWith(res, "Authenticated user ID not found.", 401);
      expect(Vendor.findOne).not.toHaveBeenCalled();
    });

    test("returns vendor profile", async () => {
      const res = resMock();
      const vendor = { userId: "u1", storeName: "Store" };
      Vendor.findOne.mockReturnValue(chain(vendor));
      await controller.profile({ auth: { id: "u1" } }, res);
      expect(Vendor.findOne).toHaveBeenCalledWith({ userId: "u1" });
      expect(ok).toHaveBeenCalledWith(res, vendor);
    });

    test("returns 404 when profile does not exist", async () => {
      const res = resMock();
      Vendor.findOne.mockReturnValue(chain(null));
      await controller.profile({ auth: { id: "u1" } }, res);
      expect(fail).toHaveBeenCalledWith(res, "Vendor profile not found.", 404);
    });
  });

  describe("dashboard", () => {
    test("aggregates products, unique orders, low stock, issues and sales", async () => {
      const res = resMock();
      getJson
        .mockResolvedValueOnce({
          ok: true,
          data: { data: { items: [
            { stock: 3 }, { stock: 10 }, { stock: 0 }, { stock: 25 }
          ]}}
        })
        .mockResolvedValueOnce({
          ok: true,
          data: { data: [
            { orderId: "a", quantity: 2, unitPrice: 10 },
            { orderId: "a", quantity: 1, unitPrice: 5 },
            { orderId: "b", quantity: 3, unitPrice: 7 }
          ]}
        })
        .mockResolvedValueOnce({ ok: true, data: { data: { count: 4 } } });

      await controller.dashboard({ auth: { id: "u/1" } }, res);

      expect(getJson).toHaveBeenNthCalledWith(
        1, "http://localhost:5003", "/api/products?vendorId=u%2F1&limit=100"
      );
      expect(getJson).toHaveBeenNthCalledWith(
        2, "http://localhost:5005", "/internal/orders/vendor/u/1/items"
      );
      expect(getJson).toHaveBeenNthCalledWith(
        3, "http://localhost:5011", "/internal/issues/vendor/u/1/count"
      );
      expect(ok).toHaveBeenCalledWith(res, {
        products: 4, orders: 2, lowStock: 2, openIssues: 4, sales: 46
      });
    });

    test("uses configured downstream URLs and fallbacks for missing data", async () => {
      process.env.PRODUCT_SERVICE_URL = "http://products/";
      process.env.ORDER_SERVICE_URL = "http://orders";
      process.env.SUPPORT_SERVICE_URL = "http://support";
      const res = resMock();
      getJson.mockResolvedValue({ ok: false, data: undefined });
      await controller.dashboard({ auth: { id: "u1" } }, res);
      expect(getJson).toHaveBeenNthCalledWith(
        1, "http://products/", "/api/products?vendorId=u1&limit=100"
      );
      expect(getJson).toHaveBeenNthCalledWith(
        2, "http://orders", "/internal/orders/vendor/u1/items"
      );
      expect(getJson).toHaveBeenNthCalledWith(
        3, "http://support", "/internal/issues/vendor/u1/count"
      );
      expect(ok).toHaveBeenCalledWith(res, {
        products: 0, orders: 0, lowStock: 0, openIssues: 0, sales: 0
      });
    });

    test("handles missing item fields through the implementation's arithmetic", async () => {
      const res = resMock();
      getJson
        .mockResolvedValueOnce({ data: { data: { items: [{ stock: 9 }] } } })
        .mockResolvedValueOnce({ data: { data: [{ orderId: 123, quantity: 2, unitPrice: 4 }] } })
        .mockResolvedValueOnce({ data: { data: {} } });
      await controller.dashboard({ auth: { id: "u1" } }, res);
      expect(ok).toHaveBeenCalledWith(res, {
        products: 1, orders: 1, lowStock: 1, openIssues: 0, sales: 8
      });
    });
  });

  describe("internal CRUD", () => {
    test("internalCreate creates a vendor and returns 201", async () => {
      const res = resMock();
      const body = { userId: "u1", storeName: "S" };
      Vendor.create.mockResolvedValue({ _id: "v1", ...body });
      await controller.internalCreate({ body }, res);
      expect(Vendor.create).toHaveBeenCalledWith(body);
      expect(ok).toHaveBeenCalledWith(res, { _id: "v1", ...body }, "Vendor created.", 201);
    });

    test("internalGetByUser returns vendor", async () => {
      const res = resMock();
      Vendor.findOne.mockReturnValue(chain({ _id: "v1" }));
      await controller.internalGetByUser({ params: { userId: "u1" } }, res);
      expect(Vendor.findOne).toHaveBeenCalledWith({ userId: "u1" });
      expect(ok).toHaveBeenCalledWith(res, { _id: "v1" });
    });

    test("internalGetByUser returns 404", async () => {
      const res = resMock();
      Vendor.findOne.mockReturnValue(chain(null));
      await controller.internalGetByUser({ params: { userId: "u1" } }, res);
      expect(fail).toHaveBeenCalledWith(res, "Vendor not found.", 404);
    });

    test("internalList sorts newest first and returns results", async () => {
      const res = resMock();
      const q = chain([{ _id: "v1" }]);
      Vendor.find.mockReturnValue(q);
      await controller.internalList({}, res);
      expect(Vendor.find).toHaveBeenCalledWith();
      expect(q.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(ok).toHaveBeenCalledWith(res, [{ _id: "v1" }]);
    });

    test("internalUpdate updates a vendor", async () => {
      const res = resMock();
      Vendor.findByIdAndUpdate.mockResolvedValue({ _id: "v1", storeName: "New" });
      const body = { storeName: "New" };
      await controller.internalUpdate({ params: { id: "v1" }, body }, res);
      expect(Vendor.findByIdAndUpdate).toHaveBeenCalledWith("v1", body, {
        new: true, runValidators: true
      });
      expect(ok).toHaveBeenCalledWith(res, { _id: "v1", storeName: "New" });
    });

    test("internalUpdate returns 404", async () => {
      const res = resMock();
      Vendor.findByIdAndUpdate.mockResolvedValue(null);
      await controller.internalUpdate({ params: { id: "v1" }, body: {} }, res);
      expect(fail).toHaveBeenCalledWith(res, "Vendor not found.", 404);
    });

    test("internalRemove deletes a vendor", async () => {
      const res = resMock();
      Vendor.findByIdAndDelete.mockResolvedValue({ _id: "v1" });
      await controller.internalRemove({ params: { id: "v1" } }, res);
      expect(Vendor.findByIdAndDelete).toHaveBeenCalledWith("v1");
      expect(ok).toHaveBeenCalledWith(res, { _id: "v1" });
    });

    test("internalRemove returns 404", async () => {
      const res = resMock();
      Vendor.findByIdAndDelete.mockResolvedValue(null);
      await controller.internalRemove({ params: { id: "v1" } }, res);
      expect(fail).toHaveBeenCalledWith(res, "Vendor not found.", 404);
    });
  });
});

