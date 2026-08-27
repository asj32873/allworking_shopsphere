const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const mongoose = require("mongoose");

const { ok, fail } = require("../utils/apiResponse");
const { ingestProduct } = require("../rag/ingest");

async function listForProduct(req, res) {
  const reviews = await Review.find({
    productId: req.params.productId,
  })
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .lean();

  ok(res, reviews);
}

async function create(req, res) {
  const { rating, review } = req.body;

  const product = await Product.findById(req.params.productId);

  if (!product) {
    return fail(res, "Product not found.", 404);
  }

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    return fail(res, "Rating must be an integer between 1 and 5.", 400);
  }

  if (!review || review.trim().length < 2) {
    return fail(res, "Review must contain at least 2 characters.", 400);
  }

  // Find delivered orders belonging to this user.
  const deliveredOrders = await Order.find({
    userId: req.user._id,
    status: "DELIVERED",
  }).distinct("_id");

  if (!deliveredOrders.length) {
    return fail(
      res,
      "You can review a product only after the order is delivered.",
      403,
    );
  }

  // Check whether the user actually purchased this product.
  const purchased = await OrderItem.exists({
    orderId: { $in: deliveredOrders },
    productId: product._id,
  });

  if (!purchased) {
    return fail(
      res,
      "You can review this product only after purchasing it.",
      403,
    );
  }

  // One review per user per product.
  const existing = await Review.exists({
    productId: product._id,
    userId: req.user._id,
  });

  if (existing) {
    return fail(res, "You have already reviewed this product.", 409);
  }

  try {
    // Create review.
    const created = await Review.create({
      productId: product._id,
      userId: req.user._id,
      rating: numericRating,
      review: review.trim(),
    });

    // Update product rating/review count.
    await recalculateRating(product._id);

    // IMPORTANT:
    // Rebuild this product's RAG document immediately.
    await ingestProduct(product._id);

    const populated = await Review.findById(created._id)
      .populate("userId", "name")
      .lean();

    return ok(res, populated, "Review submitted successfully.", 201);
  } catch (error) {
    if (error.code === 11000) {
      return fail(res, "You have already reviewed this product.", 409);
    }

    throw error;
  }
}

async function update(req, res) {
  const { rating, review } = req.body;

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    return fail(res, "Rating must be an integer between 1 and 5.", 400);
  }

  if (!review || review.trim().length < 2) {
    return fail(res, "Review must contain at least 2 characters.", 400);
  }

  const existing = await Review.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!existing) {
    return fail(res, "Review not found.", 404);
  }

  existing.rating = numericRating;
  existing.review = review.trim();

  await existing.save();

  // Recalculate product rating.
  await recalculateRating(existing.productId);

  // IMPORTANT:
  // Update RAG immediately.
  await ingestProduct(existing.productId);

  const populated = await Review.findById(existing._id)
    .populate("userId", "name")
    .lean();

  ok(res, populated, "Review updated successfully.");
}

async function remove(req, res) {
  const filter =
    req.user.role === "ADMIN"
      ? { _id: req.params.id }
      : {
          _id: req.params.id,
          userId: req.user._id,
        };

  const review = await Review.findOneAndDelete(filter);

  if (!review) {
    return fail(res, "Review not found.", 404);
  }

  // Save product ID before deleting/recalculating.
  const productId = review.productId;

  // Recalculate rating.
  await recalculateRating(productId);

  // IMPORTANT:
  // Rebuild RAG document so the deleted review disappears.
  await ingestProduct(productId);

  ok(res, null, "Review deleted successfully.");
}

async function recalculateRating(productId) {
  const stats = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
      },
    },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats.length
    ? Number(stats[0].averageRating.toFixed(2))
    : 0;

  const reviewCount = stats.length ? stats[0].reviewCount : 0;

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        rating: averageRating,
        reviewCount: reviewCount,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedProduct) {
    throw new Error(
      `Product ${productId} not found while recalculating rating`,
    );
  }

  console.log("Product rating recalculated:", {
    productId: updatedProduct._id.toString(),
    rating: updatedProduct.rating,
    reviewCount: updatedProduct.reviewCount,
  });

  return updatedProduct;
}

module.exports = {
  listForProduct,
  create,
  update,
  remove,
};
