const mongoose = require("mongoose");
const CartItem = require("../../src/models/CartItem");

describe("CartItem model", () => {
  test("creates a CartItem model", () => {
    expect(CartItem).toBeDefined();
    expect(CartItem.modelName).toBe("CartItem");
  });

  test("has required fields", () => {
    const schema = CartItem.schema;

    expect(schema.path("userId").isRequired).toBe(true);
    expect(schema.path("productId").isRequired).toBe(true);
    expect(schema.path("quantity").isRequired).toBe(true);
  });

  test("uses ObjectId for userId and productId", () => {
    expect(CartItem.schema.path("userId").instance).toBe("ObjectId");
    expect(CartItem.schema.path("productId").instance).toBe("ObjectId");
  });

  test("requires quantity to be at least 1", () => {
    const item = new CartItem({
      userId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      quantity: 0,
    });

    const error = item.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.quantity).toBeDefined();
  });

  test("accepts a valid cart item", () => {
    const item = new CartItem({
      userId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      quantity: 2,
    });

    expect(item.validateSync()).toBeUndefined();
    expect(item.quantity).toBe(2);
  });

  test("rejects a missing quantity", () => {
    const item = new CartItem({
      userId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
    });

    const error = item.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.quantity).toBeDefined();
  });

  test("has timestamps enabled", () => {
    expect(CartItem.schema.options.timestamps).toBe(true);
  });

  test("has userId index", () => {
    const indexes = CartItem.schema.indexes();

    expect(indexes.some(([fields]) => fields.userId === 1)).toBe(true);
  });

  test("has unique userId and productId compound index", () => {
    const indexes = CartItem.schema.indexes();

    expect(
      indexes.some(
        ([fields, options]) =>
          fields.userId === 1 &&
          fields.productId === 1 &&
          options &&
          options.unique === true,
      ),
    ).toBe(true);
  });
});
