const mongoose = require("mongoose");

const Review = require("../../src/models/Review");

describe("Review Model", () => {
  test("should have the correct model name", () => {
    expect(Review.modelName).toBe("Review");
  });

  test("should define the required fields", () => {
    expect(Review.schema.path("productId")).toBeDefined();
    expect(Review.schema.path("userId")).toBeDefined();
    expect(Review.schema.path("rating")).toBeDefined();
    expect(Review.schema.path("review")).toBeDefined();
  });

  test("productId should be an ObjectId and required", () => {
    const path = Review.schema.path("productId");

    expect(path.instance).toBe("ObjectId");
    expect(path.isRequired).toBe(true);
  });

  test("userId should be an ObjectId and required", () => {
    const path = Review.schema.path("userId");

    expect(path.instance).toBe("ObjectId");
    expect(path.isRequired).toBe(true);
  });

  test("rating should be a required Number", () => {
    const path = Review.schema.path("rating");

    expect(path.instance).toBe("Number");
    expect(path.isRequired).toBe(true);
  });

  test("rating should have minimum value of 1", () => {
    const path = Review.schema.path("rating");

    expect(path.options.min).toBe(1);
  });

  test("rating should have maximum value of 5", () => {
    const path = Review.schema.path("rating");

    expect(path.options.max).toBe(5);
  });

  test("review should be a required String", () => {
    const path = Review.schema.path("review");

    expect(path.instance).toBe("String");
    expect(path.isRequired).toBe(true);
  });

  test("review should have minimum length of 2", () => {
    const path = Review.schema.path("review");

    expect(path.options.minlength).toBe(2);
  });

  test("review should have maximum length of 2000", () => {
    const path = Review.schema.path("review");

    expect(path.options.maxlength).toBe(2000);
  });

  test("review should trim whitespace", () => {
    const path = Review.schema.path("review");

    expect(path.options.trim).toBe(true);
  });

  test("schema should use timestamps", () => {
    expect(Review.schema.options.timestamps).toBe(true);
  });

  test("should have productId index", () => {
    const indexes = Review.schema.indexes();

    const hasProductIdIndex = indexes.some(
      ([fields]) => fields.productId === 1
    );

    expect(hasProductIdIndex).toBe(true);
  });

  test("should have userId index", () => {
    const indexes = Review.schema.indexes();

    const hasUserIdIndex = indexes.some(
      ([fields]) => fields.userId === 1
    );

    expect(hasUserIdIndex).toBe(true);
  });

  test("should have unique productId and userId compound index", () => {
    const indexes = Review.schema.indexes();

    const compoundIndex = indexes.find(([fields, options]) => {
      return (
        fields.productId === 1 &&
        fields.userId === 1 &&
        options &&
        options.unique === true
      );
    });

    expect(compoundIndex).toBeDefined();
  });

  test("should reject a review with rating below 1", () => {
    const review = new Review({
      productId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      rating: 0,
      review: "Good product",
    });

    const error = review.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.rating).toBeDefined();
  });

  test("should reject a review with rating above 5", () => {
    const review = new Review({
      productId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      rating: 6,
      review: "Good product",
    });

    const error = review.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.rating).toBeDefined();
  });

  test("should reject a review shorter than 2 characters", () => {
    const review = new Review({
      productId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      rating: 5,
      review: "A",
    });

    const error = review.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.review).toBeDefined();
  });

  test("should create a valid review document", () => {
    const review = new Review({
      productId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      rating: 5,
      review: "Excellent product",
    });

    const error = review.validateSync();

    expect(error).toBeUndefined();
  });

  test("should trim review text", () => {
    const review = new Review({
      productId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      rating: 4,
      review: "  Good product  ",
    });

    expect(review.review).toBe("Good product");
  });
});