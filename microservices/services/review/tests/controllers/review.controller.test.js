const mongoose = require("mongoose");

jest.mock("mongoose", () => ({
  Types: {
    ObjectId: jest.fn((id) => id),
  },
}));

jest.mock("../../src/models/Review", () => ({
  find: jest.fn(),
  aggregate: jest.fn(),
  exists: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
}));

jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
  patchJson: jest.fn(),
  postJson: jest.fn(),
}));

jest.mock("../../src/services/cache.service", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
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

const Review = require("../../src/models/Review");
const {
  getJson,
  patchJson,
  postJson,
} = require("../../src/utils/serviceClient");
const cache = require("../../src/services/cache.service");

const controller = require("../../src/controllers/review.controller");

describe("Review Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      body: {},
      auth: {},
      user: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("listForProduct", () => {
    test("returns cached reviews when cache exists", async () => {
      req.params.productId = "product123";

      cache.get.mockResolvedValue([
        {
          productId: "product123",
          rating: 5,
          review: "Excellent",
        },
      ]);

      await controller.listForProduct(req, res);

      expect(cache.get).toHaveBeenCalledWith(
        "reviews:product:product123"
      );

      expect(Review.find).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: [
          {
            productId: "product123",
            rating: 5,
            review: "Excellent",
          },
        ],
      });
    });

    test("fetches reviews from database when cache is empty", async () => {
      req.params.productId = "product123";

      cache.get.mockResolvedValue(null);

      const reviews = [
        {
          productId: "product123",
          rating: 4,
          review: "Good product",
        },
      ];

      const lean = jest.fn().mockResolvedValue(reviews);
      const sort = jest.fn().mockReturnValue({ lean });

      Review.find.mockReturnValue({
        sort,
      });

      await controller.listForProduct(req, res);

      expect(Review.find).toHaveBeenCalledWith({
        productId: "product123",
      });

      expect(sort).toHaveBeenCalledWith({
        createdAt: -1,
      });

      expect(lean).toHaveBeenCalled();

      expect(cache.set).toHaveBeenCalledWith(
        "reviews:product:product123",
        reviews
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("create", () => {
    beforeEach(() => {
      req.params.productId = "product123";
      req.body = {
        rating: 5,
        review: "Excellent product",
      };
      req.auth = {
        id: "user123",
      };
    });

    test("returns 401 when authenticated user ID is missing", async () => {
      req.auth = {};
      req.user = {};

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Authenticated user ID not found.",
      });

      expect(getJson).not.toHaveBeenCalled();
    });

    test("returns 404 when product does not exist", async () => {
      getJson.mockResolvedValue({
        ok: false,
      });

      await controller.create(req, res);

      expect(getJson).toHaveBeenCalledWith(
        "http://localhost:5003",
        "/internal/products/product123"
      );

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Product not found.",
      });
    });

    test("returns 400 for invalid rating", async () => {
      req.body.rating = 6;

      getJson.mockResolvedValue({
        ok: true,
      });

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Rating must be an integer between 1 and 5.",
      });
    });

    test("returns 400 when review is too short", async () => {
      req.body.review = "a";

      getJson.mockResolvedValue({
        ok: true,
      });

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Review must contain at least 2 characters.",
      });
    });

    test("returns 403 when user is not eligible to review", async () => {
      getJson
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: false,
          data: {
            data: {
              eligible: false,
            },
          },
        });

      await controller.create(req, res);

      expect(getJson).toHaveBeenNthCalledWith(
        2,
        "http://localhost:5005",
        "/internal/orders/review-eligibility/user123/product123"
      );

      expect(res.status).toHaveBeenCalledWith(403);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          "You can review this product only after purchasing it and receiving a delivered order.",
      });
    });

    test("returns 409 when user already reviewed the product", async () => {
      getJson
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: {
              eligible: true,
            },
          },
        });

      Review.exists.mockResolvedValue(true);

      await controller.create(req, res);

      expect(Review.exists).toHaveBeenCalledWith({
        productId: "product123",
        userId: "user123",
      });

      expect(res.status).toHaveBeenCalledWith(409);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You have already reviewed this product.",
      });
    });

    test("creates a review successfully", async () => {
      getJson
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: {
              eligible: true,
            },
          },
        });

      Review.exists.mockResolvedValue(false);

      const created = {
        productId: "product123",
        userId: "user123",
        rating: 5,
        review: "Excellent product",
      };

      Review.create.mockResolvedValue(created);

      Review.aggregate.mockResolvedValue([
        {
          averageRating: 5,
          reviewCount: 1,
        },
      ]);

      patchJson.mockResolvedValue({
        ok: true,
      });

      await controller.create(req, res);

      expect(Review.create).toHaveBeenCalledWith({
        productId: "product123",
        userId: "user123",
        rating: 5,
        review: "Excellent product",
      });

      expect(cache.del).toHaveBeenCalledWith(
        "reviews:product:product123"
      );

      expect(patchJson).toHaveBeenCalledWith(
        "http://localhost:5003",
        "/internal/products/product123/rating",
        {
          rating: 5,
          reviewCount: 1,
        }
      );

      expect(postJson).toHaveBeenCalledWith(
        "http://localhost:5010",
        "/internal/products/product123/ingest",
        {}
      );

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("update", () => {
    beforeEach(() => {
      req.params.id = "review123";
      req.user = {
        id: "user123",
      };
      req.body = {
        rating: 4,
        review: "Updated review",
      };
    });

    test("returns 404 when review is not found", async () => {
      Review.findOne.mockResolvedValue(null);

      await controller.update(req, res);

      expect(Review.findOne).toHaveBeenCalledWith({
        _id: "review123",
        userId: "user123",
      });

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns 400 for invalid rating", async () => {
      const review = {
        rating: 5,
        review: "Old review",
      };

      Review.findOne.mockResolvedValue(review);

      req.body.rating = 10;

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Rating must be an integer between 1 and 5.",
      });
    });

    test("updates a review successfully", async () => {
      const review = {
        productId: "product123",
        rating: 3,
        review: "Old review",
        save: jest.fn().mockResolvedValue(true),
      };

      Review.findOne.mockResolvedValue(review);

      Review.aggregate.mockResolvedValue([
        {
          averageRating: 4,
          reviewCount: 2,
        },
      ]);

      patchJson.mockResolvedValue({
        ok: true,
      });

      await controller.update(req, res);

      expect(review.rating).toBe(4);
      expect(review.review).toBe("Updated review");

      expect(review.save).toHaveBeenCalled();

      expect(cache.del).toHaveBeenCalledWith(
        "reviews:product:product123"
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("remove", () => {
    beforeEach(() => {
      req.params.id = "review123";
      req.user = {
        id: "user123",
        role: "USER",
      };
    });

    test("returns 404 when review does not exist", async () => {
      Review.findOneAndDelete.mockResolvedValue(null);

      await controller.remove(req, res);

      expect(Review.findOneAndDelete).toHaveBeenCalledWith({
        _id: "review123",
        userId: "user123",
      });

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("deletes user review successfully", async () => {
      const review = {
        productId: "product123",
      };

      Review.findOneAndDelete.mockResolvedValue(review);

      Review.aggregate.mockResolvedValue([
        {
          averageRating: 4,
          reviewCount: 1,
        },
      ]);

      patchJson.mockResolvedValue({
        ok: true,
      });

      await controller.remove(req, res);

      expect(Review.findOneAndDelete).toHaveBeenCalledWith({
        _id: "review123",
        userId: "user123",
      });

      expect(cache.del).toHaveBeenCalledWith(
        "reviews:product:product123"
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Review deleted successfully.",
        data: null,
      });
    });

    test("admin can delete any review", async () => {
      req.user.role = "ADMIN";

      const review = {
        productId: "product123",
      };

      Review.findOneAndDelete.mockResolvedValue(review);

      Review.aggregate.mockResolvedValue([]);

      patchJson.mockResolvedValue({
        ok: true,
      });

      await controller.remove(req, res);

      expect(Review.findOneAndDelete).toHaveBeenCalledWith({
        _id: "review123",
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});