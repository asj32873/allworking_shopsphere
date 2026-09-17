const mockProduct = {
  find: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn(),
  startSession: jest.fn(),
  bulkWrite: jest.fn(),
};

jest.mock("../../src/models/Product", () => mockProduct);

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  delByPattern: jest.fn(),
};

jest.mock("../../src/services/cache.service", () => mockCache);

const mockIngestProduct = jest.fn();
const mockDeleteProduct = jest.fn();

jest.mock("../../src/services/rag.service", () => ({
  ingestProduct: mockIngestProduct,
  deleteProduct: mockDeleteProduct,
}));

const mockGetVendorByUserId = jest.fn();
const mockGetAllVendors = jest.fn();

jest.mock("../../src/services/vendor.service", () => ({
  getVendorByUserId: mockGetVendorByUserId,
  getAllVendors: mockGetAllVendors,
}));

const {
  list,
  getById,
  create,
  update,
  remove,
  updateStock,
  internalGet,
  internalList,
  internalReserve,
  internalRelease,
  internalRating,
} = require("../../src/controllers/product.controller");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function chainableQuery(result) {
  return {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
    select: jest.fn().mockReturnThis(),
  };
}

describe("product controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue(true);
    mockCache.del.mockResolvedValue(true);
    mockCache.delByPattern.mockResolvedValue(true);

    mockIngestProduct.mockResolvedValue({
      ok: true,
      status: 200,
    });

    mockDeleteProduct.mockResolvedValue({
      ok: true,
      status: 200,
    });

    mockGetVendorByUserId.mockResolvedValue(null);
    mockGetAllVendors.mockResolvedValue([]);
  });

  describe("list", () => {
    test("returns cached products", async () => {
      const cached = {
        items: [
          {
            _id: "product-1",
            name: "Phone",
          },
        ],
        page: 1,
        limit: 9,
        total: 1,
        totalPages: 1,
      };

      mockCache.get.mockResolvedValue(cached);

      const req = {
        query: {},
      };

      const res = createResponse();

      await list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: cached,
      });

      expect(mockProduct.find).not.toHaveBeenCalled();
    });

    test("returns products with vendor information", async () => {
      const products = [
        {
          _id: "product-1",
          vendorId: "vendor-user-1",
          name: "Phone",
        },
        {
          _id: "product-2",
          vendorId: "vendor-user-2",
          name: "Laptop",
        },
      ];

      mockProduct.find.mockReturnValue(
        chainableQuery(products)
      );

      mockProduct.countDocuments.mockResolvedValue(2);

      mockGetAllVendors.mockResolvedValue([
        {
          userId: "vendor-user-1",
          name: "Vendor One",
        },
        {
          userId: "vendor-user-2",
          name: "Vendor Two",
        },
      ]);

      const req = {
        query: {
          page: "1",
          limit: "2",
          sort: "low",
        },
      };

      const res = createResponse();

      await list(req, res);

      expect(mockProduct.find).toHaveBeenCalledWith({});

      expect(mockProduct.countDocuments).toHaveBeenCalledWith({});

      expect(mockGetAllVendors).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: {
          items: [
            {
              ...products[0],
              vendor: {
                userId: "vendor-user-1",
                name: "Vendor One",
              },
            },
            {
              ...products[1],
              vendor: {
                userId: "vendor-user-2",
                name: "Vendor Two",
              },
            },
          ],
          page: 1,
          limit: 2,
          total: 2,
          totalPages: 1,
        },
      });
    });

    test("sets product list cache", async () => {
      const products = [
        {
          _id: "product-1",
          vendorId: "vendor-1",
        },
      ];

      mockProduct.find.mockReturnValue(
        chainableQuery(products)
      );

      mockProduct.countDocuments.mockResolvedValue(1);
      mockGetAllVendors.mockResolvedValue([]);

      const req = {
        query: {},
      };

      const res = createResponse();

      await list(req, res);

      expect(mockCache.set).toHaveBeenCalled();
    });

    test("attaches null vendor when vendor does not exist", async () => {
      const products = [
        {
          _id: "product-1",
          vendorId: "missing-vendor",
        },
      ];

      mockProduct.find.mockReturnValue(
        chainableQuery(products)
      );

      mockProduct.countDocuments.mockResolvedValue(1);
      mockGetAllVendors.mockResolvedValue([]);

      const req = {
        query: {},
      };

      const res = createResponse();

      await list(req, res);

      const responseData =
        res.json.mock.calls[0][0].data;

      expect(responseData.items[0].vendor).toBeNull();
    });
  });

  describe("getById", () => {
    test("returns cached product", async () => {
      const cached = {
        _id: "product-1",
        name: "Phone",
      };

      mockCache.get.mockResolvedValue(cached);

      const req = {
        params: {
          id: "product-1",
        },
      };

      const res = createResponse();

      await getById(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: cached,
      });

      expect(mockProduct.findById).not.toHaveBeenCalled();
    });

    test("returns 404 when product does not exist", async () => {
      mockProduct.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const req = {
        params: {
          id: "missing",
        },
      };

      const res = createResponse();

      await getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Product not found.",
      });
    });

    test("returns product with vendor", async () => {
      const product = {
        _id: "product-1",
        vendorId: "user-1",
        name: "Phone",
      };

      const vendor = {
        id: "vendor-1",
        userId: "user-1",
        name: "Vendor",
      };

      mockProduct.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(product),
      });

      mockGetVendorByUserId.mockResolvedValue(vendor);

      const req = {
        params: {
          id: "product-1",
        },
      };

      const res = createResponse();

      await getById(req, res);

      expect(mockGetVendorByUserId).toHaveBeenCalledWith(
        "user-1"
      );

      expect(mockCache.set).toHaveBeenCalledWith(
        "product:product-1",
        {
          ...product,
          vendor,
        }
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: {
          ...product,
          vendor,
        },
      });
    });
  });

  describe("create", () => {
    test("creates product with authenticated vendor", async () => {
      const product = {
        _id: "product-1",
        name: "Phone",
        vendorId: "user-1",
      };

      mockProduct.create.mockResolvedValue(product);

      const req = {
        body: {
          name: "Phone",
          description: "Smartphone",
          brand: "Apple",
          category: "MOBILE",
          price: 70000,
        },
        user: {
          _id: "user-1",
        },
      };

      const res = createResponse();

      await create(req, res);

      expect(mockProduct.create).toHaveBeenCalledWith({
        ...req.body,
        vendorId: "user-1",
      });

      expect(mockIngestProduct).toHaveBeenCalledWith(
        "product-1"
      );

      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        "products:list:*"
      );

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Product created.",
        data: product,
      });
    });
  });

  describe("update", () => {
    test("updates owned product", async () => {
      const product = {
        _id: "product-1",
        name: "Updated Phone",
      };

      mockProduct.findOneAndUpdate.mockResolvedValue(product);

      const req = {
        params: {
          id: "product-1",
        },
        body: {
          name: "Updated Phone",
        },
        user: {
          _id: "user-1",
        },
      };

      const res = createResponse();

      await update(req, res);

      expect(mockProduct.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: "product-1",
          vendorId: "user-1",
        },
        {
          name: "Updated Phone",
        },
        {
          new: true,
          runValidators: true,
        }
      );

      expect(mockIngestProduct).toHaveBeenCalledWith(
        "product-1"
      );

      expect(mockCache.del).toHaveBeenCalledWith(
        "product:product-1"
      );

      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        "products:list:*"
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Product updated.",
        data: product,
      });
    });

    test("returns 404 when product is not owned", async () => {
      mockProduct.findOneAndUpdate.mockResolvedValue(null);

      const req = {
        params: {
          id: "product-1",
        },
        body: {
          name: "Updated",
        },
        user: {
          _id: "user-1",
        },
      };

      const res = createResponse();

      await update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Product not found or not owned by you.",
      });

      expect(mockIngestProduct).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    test("deletes owned product", async () => {
      const product = {
        _id: "product-1",
      };

      mockProduct.findOneAndDelete.mockResolvedValue(product);

      const req = {
        params: {
          id: "product-1",
        },
        user: {
          _id: "user-1",
        },
      };

      const res = createResponse();

      await remove(req, res);

      expect(mockProduct.findOneAndDelete).toHaveBeenCalledWith({
        _id: "product-1",
        vendorId: "user-1",
      });

      expect(mockDeleteProduct).toHaveBeenCalledWith(
        "product-1"
      );

      expect(mockCache.del).toHaveBeenCalledWith(
        "product:product-1"
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Product deleted.",
        data: null,
      });
    });

    test("returns 404 when product does not exist", async () => {
      mockProduct.findOneAndDelete.mockResolvedValue(null);

      const req = {
        params: {
          id: "missing",
        },
        user: {
          _id: "user-1",
        },
      };

      const res = createResponse();

      await remove(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(mockDeleteProduct).not.toHaveBeenCalled();
    });
  });

  describe("updateStock", () => {
    test("rejects negative stock", async () => {
      const req = {
        body: {
          stock: -1,
        },
        params: {
          id: "product-1",
        },
        user: {
          _id: "user-1",
        },
      };

      const res = createResponse();

      await updateStock(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Stock must be a non-negative integer.",
      });

      expect(mockProduct.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test("rejects decimal stock", async () => {
      const req = {
        body: {
          stock: 2.5,
        },
        params: {
          id: "product-1",
        },
        user: {
          _id: "user-1",
        },
      };

      const res = createResponse();

      await updateStock(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockProduct.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test("updates stock", async () => {
      const product = {
        _id: "product-1",
        stock: 20,
      };

      mockProduct.findOneAndUpdate.mockResolvedValue(product);

      const req = {
        body: {
          stock: "20",
        },
        params: {
          id: "product-1",
        },
        user: {
          _id: "user-1",
        },
      };

      const res = createResponse();

      await updateStock(req, res);

      expect(mockProduct.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: "product-1",
          vendorId: "user-1",
        },
        {
          stock: 20,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      expect(mockIngestProduct).toHaveBeenCalledWith(
        "product-1"
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Stock updated.",
        data: product,
      });
    });

    test("returns 404 when product does not exist", async () => {
      mockProduct.findOneAndUpdate.mockResolvedValue(null);

      const req = {
        body: {
          stock: 10,
        },
        params: {
          id: "product-1",
        },
        user: {
          _id: "user-1",
        },
      };

      const res = createResponse();

      await updateStock(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Product not found or not owned by you.",
      });
    });
  });

  describe("internalGet", () => {
    test("returns product", async () => {
      const product = {
        _id: "product-1",
        name: "Phone",
      };

      mockProduct.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(product),
      });

      const req = {
        params: {
          id: "product-1",
        },
      };

      const res = createResponse();

      await internalGet(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: product,
      });
    });

    test("returns 404 when product does not exist", async () => {
      mockProduct.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const req = {
        params: {
          id: "missing",
        },
      };

      const res = createResponse();

      await internalGet(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("internalList", () => {
    test("returns product ids", async () => {
      const products = [
        {
          _id: "product-1",
        },
        {
          _id: "product-2",
        },
      ];

      mockProduct.find.mockReturnValue(
        chainableQuery(products)
      );

      const req = {};
      const res = createResponse();

      await internalList(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: products,
      });
    });
  });

  describe("internalReserve", () => {
    test("rejects missing items", async () => {
      const req = {
        body: {},
      };

      const res = createResponse();

      await internalReserve(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "items are required.",
      });

      expect(mockProduct.startSession).not.toHaveBeenCalled();
    });

    test("rejects empty items array", async () => {
      const req = {
        body: {
          items: [],
        },
      };

      const res = createResponse();

      await internalReserve(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockProduct.startSession).not.toHaveBeenCalled();
    });

    test("reserves stock successfully", async () => {
      const session = {
        withTransaction: jest.fn(),
        endSession: jest.fn(),
      };

      mockProduct.startSession.mockResolvedValue(session);

      const reservedProduct = {
        _id: "product-1",
        stock: 8,
      };

      mockProduct.findOneAndUpdate.mockResolvedValue(
        reservedProduct
      );

      session.withTransaction.mockImplementation(
        async (callback) => {
          await callback();
        }
      );

      const req = {
        body: {
          items: [
            {
              productId: "product-1",
              quantity: 2,
            },
          ],
        },
      };

      const res = createResponse();

      await internalReserve(req, res);

      expect(
        mockProduct.findOneAndUpdate
      ).toHaveBeenCalledWith(
        {
          _id: "product-1",
          stock: {
            $gte: 2,
          },
        },
        {
          $inc: {
            stock: -2,
          },
        },
        {
          new: true,
          session,
        }
      );

      expect(mockIngestProduct).toHaveBeenCalledWith(
        "product-1"
      );

      expect(mockCache.del).toHaveBeenCalledWith(
        "product:product-1"
      );

      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        "products:list:*"
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Stock reserved.",
        data: [reservedProduct],
      });

      expect(session.endSession).toHaveBeenCalled();
    });

    test("throws conflict error when stock is insufficient", async () => {
      const session = {
        withTransaction: jest.fn(),
        endSession: jest.fn(),
      };

      mockProduct.startSession.mockResolvedValue(session);

      mockProduct.findOneAndUpdate.mockResolvedValue(null);

      session.withTransaction.mockImplementation(
        async (callback) => {
          await callback();
        }
      );

      const req = {
        body: {
          items: [
            {
              productId: "product-1",
              quantity: 10,
            },
          ],
        },
      };

      const res = createResponse();

      await expect(
        internalReserve(req, res)
      ).rejects.toMatchObject({
        status: 409,
        message: "Insufficient stock for product product-1",
      });

      expect(session.endSession).toHaveBeenCalled();
    });

    test("always ends session after transaction failure", async () => {
      const session = {
        withTransaction: jest.fn().mockRejectedValue(
          new Error("Transaction failed")
        ),
        endSession: jest.fn(),
      };

      mockProduct.startSession.mockResolvedValue(session);

      const req = {
        body: {
          items: [
            {
              productId: "product-1",
              quantity: 1,
            },
          ],
        },
      };

      const res = createResponse();

      await expect(
        internalReserve(req, res)
      ).rejects.toThrow("Transaction failed");

      expect(session.endSession).toHaveBeenCalled();
    });
  });

  describe("internalRelease", () => {
    test("rejects missing items", async () => {
      const req = {
        body: {},
      };

      const res = createResponse();

      await internalRelease(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "items are required.",
      });
    });

    test("rejects non-array items", async () => {
      const req = {
        body: {
          items: {},
        },
      };

      const res = createResponse();

      await internalRelease(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("exposes current implementation bug with product variable", async () => {
      mockProduct.bulkWrite.mockResolvedValue({
        modifiedCount: 1,
      });

      mockCache.del.mockResolvedValue(true);
      mockCache.delByPattern.mockResolvedValue(true);

      const req = {
        body: {
          items: [
            {
              productId: "product-1",
              quantity: 2,
            },
          ],
        },
      };

      const res = createResponse();

      await expect(
        internalRelease(req, res)
      ).rejects.toThrow(ReferenceError);

      expect(mockProduct.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: {
              _id: "product-1",
            },
            update: {
              $inc: {
                stock: 2,
              },
            },
          },
        },
      ]);

      expect(mockCache.del).toHaveBeenCalledWith(
        "product:product-1"
      );

      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        "products:list:*"
      );
    });
  });

  describe("internalRating", () => {
    test("updates rating", async () => {
      const product = {
        _id: "product-1",
        rating: 4.5,
        reviewCount: 10,
      };

      mockProduct.findByIdAndUpdate.mockResolvedValue(product);

      const req = {
        params: {
          id: "product-1",
        },
        body: {
          rating: "4.5",
          reviewCount: "10",
        },
      };

      const res = createResponse();

      await internalRating(req, res);

      expect(
        mockProduct.findByIdAndUpdate
      ).toHaveBeenCalledWith(
        "product-1",
        {
          rating: 4.5,
          reviewCount: 10,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      expect(mockIngestProduct).toHaveBeenCalledWith(
        "product-1"
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: product,
      });
    });

    test("uses zero for falsy rating values", async () => {
      const product = {
        _id: "product-1",
        rating: 0,
        reviewCount: 0,
      };

      mockProduct.findByIdAndUpdate.mockResolvedValue(product);

      const req = {
        params: {
          id: "product-1",
        },
        body: {
          rating: "",
          reviewCount: "",
        },
      };

      const res = createResponse();

      await internalRating(req, res);

      expect(
        mockProduct.findByIdAndUpdate
      ).toHaveBeenCalledWith(
        "product-1",
        {
          rating: 0,
          reviewCount: 0,
        },
        {
          new: true,
          runValidators: true,
        }
      );
    });

    test("returns 404 when product does not exist", async () => {
      mockProduct.findByIdAndUpdate.mockResolvedValue(null);

      const req = {
        params: {
          id: "missing",
        },
        body: {
          rating: 4,
          reviewCount: 1,
        },
      };

      const res = createResponse();

      await internalRating(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Product not found.",
      });

      expect(mockIngestProduct).not.toHaveBeenCalled();
    });
  });
});