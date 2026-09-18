const mongoose = require("mongoose");

const Product = require("../../src/models/Product");

describe("Product model", () => {
  test("vendorId is required and is an ObjectId", () => {
    const path = Product.schema.path("vendorId");

    expect(path).toBeDefined();
    expect(path.isRequired).toBe(true);
    expect(path.instance).toBe("ObjectId");
  });

  test("required string fields are configured correctly", () => {
    const fields = ["name", "description", "brand", "category"];

    fields.forEach((field) => {
      const path = Product.schema.path(field);

      expect(path).toBeDefined();
      expect(path.isRequired).toBe(true);
      expect(path.instance).toBe("String");
    });
  });

  test("category has expected enum values", () => {
    const path = Product.schema.path("category");

    expect(path.enumValues).toEqual([
      "ELECTRONICS",
      "MOBILE",
      "LAPTOP",
      "AUDIO",
      "TV",
      "HOME_APPLIANCES",
      "ACCESSORIES",
      "OTHER",
    ]);
  });

  test("price is required and has minimum zero", () => {
    const path = Product.schema.path("price");

    expect(path.instance).toBe("Number");
    expect(path.isRequired).toBe(true);
    expect(path.options.min).toBe(0);
  });

  test("stock has minimum zero and default zero", () => {
    const path = Product.schema.path("stock");

    expect(path.instance).toBe("Number");
    expect(path.options.min).toBe(0);
    expect(path.options.default).toBe(0);
  });

  test("imageUrl is optional string", () => {
    const path = Product.schema.path("imageUrl");

    expect(path.instance).toBe("String");
    expect(path.isRequired).not.toBe(true);
  });

  test("rating has default zero and maximum five", () => {
    const path = Product.schema.path("rating");

    expect(path.instance).toBe("Number");
    expect(path.options.default).toBe(0);
    expect(path.options.min).toBe(0);
    expect(path.options.max).toBe(5);
  });

  test("reviewCount has default zero", () => {
    const path = Product.schema.path("reviewCount");

    expect(path.instance).toBe("Number");
    expect(path.options.default).toBe(0);
  });

  test("timestamps are enabled", () => {
    expect(Product.schema.options.timestamps).toBe(true);
  });

  test("creates a valid product", () => {
    const product = new Product({
      vendorId: new mongoose.Types.ObjectId(),
      name: "Test Product",
      description: "Test description",
      brand: "Test Brand",
      category: "ELECTRONICS",
      price: 999,
      stock: 10,
      imageUrl: "https://example.com/product.jpg",
    });

    const error = product.validateSync();

    expect(error).toBeUndefined();
    expect(product.rating).toBe(0);
    expect(product.reviewCount).toBe(0);
  });

  test("fails when vendorId is missing", () => {
    const product = new Product({
      name: "Test Product",
      description: "Test description",
      brand: "Test Brand",
      category: "ELECTRONICS",
      price: 999,
    });

    const error = product.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.vendorId).toBeDefined();
  });

  test("fails when required fields are missing", () => {
    const product = new Product({});

    const error = product.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.vendorId).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.description).toBeDefined();
    expect(error.errors.brand).toBeDefined();
    expect(error.errors.category).toBeDefined();
    expect(error.errors.price).toBeDefined();
  });

  test("fails for invalid category", () => {
    const product = new Product({
      vendorId: new mongoose.Types.ObjectId(),
      name: "Test Product",
      description: "Test description",
      brand: "Test Brand",
      category: "INVALID",
      price: 999,
    });

    const error = product.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.category).toBeDefined();
  });

  test("fails for negative price", () => {
    const product = new Product({
      vendorId: new mongoose.Types.ObjectId(),
      name: "Test Product",
      description: "Test description",
      brand: "Test Brand",
      category: "ELECTRONICS",
      price: -100,
    });

    const error = product.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.price).toBeDefined();
  });

  test("fails for negative stock", () => {
    const product = new Product({
      vendorId: new mongoose.Types.ObjectId(),
      name: "Test Product",
      description: "Test description",
      brand: "Test Brand",
      category: "ELECTRONICS",
      price: 100,
      stock: -1,
    });

    const error = product.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.stock).toBeDefined();
  });

  test("fails when rating is greater than five", () => {
    const product = new Product({
      vendorId: new mongoose.Types.ObjectId(),
      name: "Test Product",
      description: "Test description",
      brand: "Test Brand",
      category: "ELECTRONICS",
      price: 100,
      rating: 6,
    });

    const error = product.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.rating).toBeDefined();
  });
});