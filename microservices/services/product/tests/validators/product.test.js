const { productSchema } = require("../../src/validators/product");

describe("productSchema", () => {
  const validProduct = {
    name: "iPhone 15",
    description: "Apple smartphone",
    brand: "Apple",
    category: "MOBILE",
    price: 70000,
    stock: 10,
    imageUrl: "https://example.com/iphone.jpg",
  };

  test("accepts a valid product", () => {
    const result = productSchema.safeParse(validProduct);

    expect(result.success).toBe(true);
  });

  test("accepts product without optional stock", () => {
    const product = {
      ...validProduct,
    };

    delete product.stock;

    const result = productSchema.safeParse(product);

    expect(result.success).toBe(true);
  });

  test("accepts product without optional imageUrl", () => {
    const product = {
      ...validProduct,
    };

    delete product.imageUrl;

    const result = productSchema.safeParse(product);

    expect(result.success).toBe(true);
  });

  test("rejects missing name", () => {
    const product = {
      ...validProduct,
    };

    delete product.name;

    const result = productSchema.safeParse(product);

    expect(result.success).toBe(false);
  });

  test("rejects empty name", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      name: "",
    });

    expect(result.success).toBe(false);
  });

  test("rejects missing description", () => {
    const product = {
      ...validProduct,
    };

    delete product.description;

    const result = productSchema.safeParse(product);

    expect(result.success).toBe(false);
  });

  test("rejects empty description", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      description: "",
    });

    expect(result.success).toBe(false);
  });

  test("rejects missing brand", () => {
    const product = {
      ...validProduct,
    };

    delete product.brand;

    const result = productSchema.safeParse(product);

    expect(result.success).toBe(false);
  });

  test("rejects empty brand", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      brand: "",
    });

    expect(result.success).toBe(false);
  });

  test("accepts every valid category", () => {
    const categories = [
      "ELECTRONICS",
      "MOBILE",
      "LAPTOP",
      "AUDIO",
      "TV",
      "HOME_APPLIANCES",
      "ACCESSORIES",
      "OTHER",
    ];

    for (const category of categories) {
      const result = productSchema.safeParse({
        ...validProduct,
        category,
      });

      expect(result.success).toBe(true);
    }
  });

  test("rejects invalid category", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      category: "INVALID",
    });

    expect(result.success).toBe(false);
  });

  test("accepts zero price", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      price: 0,
    });

    expect(result.success).toBe(true);
  });

  test("accepts positive price", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      price: 999.99,
    });

    expect(result.success).toBe(true);
  });

  test("rejects negative price", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      price: -1,
    });

    expect(result.success).toBe(false);
  });

  test("rejects non-number price", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      price: "70000",
    });

    expect(result.success).toBe(false);
  });

  test("accepts zero stock", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      stock: 0,
    });

    expect(result.success).toBe(true);
  });

  test("accepts positive integer stock", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      stock: 50,
    });

    expect(result.success).toBe(true);
  });

  test("rejects negative stock", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      stock: -1,
    });

    expect(result.success).toBe(false);
  });

  test("rejects decimal stock", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      stock: 2.5,
    });

    expect(result.success).toBe(false);
  });

  test("rejects non-number stock", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      stock: "10",
    });

    expect(result.success).toBe(false);
  });

  test("accepts imageUrl as a string", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      imageUrl: "https://example.com/product.jpg",
    });

    expect(result.success).toBe(true);
  });

  test("accepts empty imageUrl string", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      imageUrl: "",
    });

    expect(result.success).toBe(true);
  });

  test("rejects non-string imageUrl", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      imageUrl: 123,
    });

    expect(result.success).toBe(false);
  });
});