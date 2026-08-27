const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const { ok, fail } = require("../utils/apiResponse");

async function getCart(req, res) {
  const items = await CartItem.find({ userId: req.user._id })
    .populate("productId")
    .lean();

  const mapped = items.map((item) => {
    const product = item.productId;

    // Product was deleted
    if (!product) {
      return {
        id: item._id,
        productId: null,
        quantity: item.quantity,
        product: null,
        subtotal: 0,
        availableStock: 0,
        available: false,
        status: "PRODUCT_UNAVAILABLE",
      };
    }

    const availableStock = product.stock;
    const available = availableStock >= item.quantity;

    let status = "AVAILABLE";

    if (availableStock === 0) {
      status = "OUT_OF_STOCK";
    } else if (availableStock < item.quantity) {
      status = "INSUFFICIENT_STOCK";
    }

    return {
      id: item._id,
      productId: product._id,
      quantity: item.quantity,
      product,
      subtotal: available
        ? product.price * item.quantity
        : product.price * Math.min(item.quantity, availableStock),
      availableStock,
      available,
      status,
    };
  });

  const availableItems = mapped.filter((item) => item.available);

  const unavailableItems = mapped.filter((item) => !item.available);

  const total = availableItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  ok(res, {
    items: mapped,
    availableItems,
    unavailableItems,
    total,

    hasUnavailableItems: unavailableItems.length > 0,

    canPlaceOrder: availableItems.length > 0,
  });
}

async function addItem(req, res) {
  const { productId, quantity = 1 } = req.body;

  const qty = Number(quantity);

  if (!Number.isInteger(qty) || qty < 1) {
    return fail(res, "Quantity must be a positive integer.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    return fail(res, "Product not found.", 404);
  }

  if (product.stock === 0) {
    return fail(res, "This product is currently out of stock.", 409);
  }

  const existingItem = await CartItem.findOne({
    userId: req.user._id,
    productId,
  });

  const newQuantity = existingItem ? existingItem.quantity + qty : qty;

  if (newQuantity > product.stock) {
    return fail(
      res,
      `Only ${product.stock} unit(s) of ${product.name} are currently available.`,
      409,
    );
  }

  const item = existingItem
    ? await CartItem.findOneAndUpdate(
        {
          userId: req.user._id,
          productId,
        },
        {
          $set: {
            quantity: newQuantity,
          },
        },
        {
          new: true,
        },
      )
    : await CartItem.create({
        userId: req.user._id,
        productId,
        quantity: qty,
      });

  ok(res, item, "Added to cart.");
}

async function updateItem(req, res) {
  const qty = Number(req.body.quantity);

  if (!Number.isInteger(qty) || qty < 1) {
    return removeItem(req, res);
  }

  const item = await CartItem.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!item) {
    return fail(res, "Cart item not found.", 404);
  }

  const product = await Product.findById(item.productId);

  if (!product) {
    return fail(res, "Product no longer exists.", 404);
  }

  if (qty > product.stock) {
    return fail(
      res,
      `Only ${product.stock} unit(s) are currently available.`,
      409,
    );
  }

  item.quantity = qty;
  await item.save();

  ok(res, item, "Cart updated.");
}

async function removeItem(req, res) {
  const item = await CartItem.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!item) {
    return fail(res, "Cart item not found.", 404);
  }

  ok(res, null, "Cart item removed.");
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
};
