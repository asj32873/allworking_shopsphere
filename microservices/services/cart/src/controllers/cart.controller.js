const CartItem = require("../models/CartItem");
const { getJson } = require("../utils/serviceClient");
const { ok, fail } = require("../utils/apiResponse");

const PRODUCT = () =>
  process.env.PRODUCT_SERVICE_URL || "http://localhost:5003";

async function getCart(req, res) {
  const userId = req.auth.id;

  const items = await CartItem.find({
    userId,
  }).lean();

  const out = [];

  for (const item of items) {
    const r = await getJson(PRODUCT(), `/internal/products/${item.productId}`);

    const p = r.data?.data;

    if (!p) {
      out.push({
        id: item._id,
        productId: null,
        quantity: item.quantity,
        product: null,
        subtotal: 0,
        availableStock: 0,
        available: false,
        status: "PRODUCT_UNAVAILABLE",
      });
    } else {
      out.push({
        id: item._id,
        productId: p._id,
        quantity: item.quantity,
        product: p,
        subtotal: item.quantity * p.price,
        availableStock: p.stock,
        available: p.stock >= item.quantity,
        status:
          p.stock === 0
            ? "OUT_OF_STOCK"
            : p.stock < item.quantity
              ? "INSUFFICIENT_STOCK"
              : "AVAILABLE",
      });
    }
  }

  ok(res, out);
}

async function add(req, res) {
  const userId = req.auth.id;
  const { productId, quantity = 1 } = req.body;

  const qty = Number(quantity);

  if (!productId || !Number.isInteger(qty) || qty < 1) {
    return fail(res, "productId and a positive integer quantity are required.");
  }

  // Check product
  const r = await getJson(PRODUCT(), `/internal/products/${productId}`);

  const p = r.data?.data;

  if (!r.ok || !p) {
    return fail(res, "Product not found.", 404);
  }

  // Find existing cart item
  let item = await CartItem.findOne({
    userId,
    productId,
  });

  if (item) {
    // Calculate the NEW quantity
    const newQuantity = item.quantity + qty;

    // Check stock against the TOTAL quantity
    if (newQuantity > p.stock) {
      return fail(res, `Only ${p.stock} item(s) are available.`, 409);
    }

    item.quantity = newQuantity;

    await item.save();
  } else {
    // New cart item
    if (qty > p.stock) {
      return fail(res, `Only ${p.stock} item(s) are available.`, 409);
    }

    item = await CartItem.create({
      userId,
      productId,
      quantity: qty,
    });
  }

  ok(res, item, "Cart updated.");
}

async function update(req, res) {
  const userId = req.auth.id;
  const q = Number(req.body.quantity);

  if (!Number.isInteger(q) || q < 1) {
    return fail(res, "Quantity must be a positive integer.");
  }

  const item = await CartItem.findOne({
    userId,
    _id: req.params.id,
  });

  if (!item) {
    return fail(res, "Cart item not found.", 404);
  }

  const r = await getJson(PRODUCT(), `/internal/products/${item.productId}`);

  const p = r.data?.data;

  if (!p) {
    return fail(res, "Product not found.", 404);
  }

  if (p.stock < q) {
    return fail(res, `Only ${p.stock} item(s) are available.`, 409);
  }

  item.quantity = q;

  await item.save();

  ok(res, item, "Cart item updated.");
}

async function remove(req, res) {
  const userId = req.auth.id;

  const item = await CartItem.findOneAndDelete({
    userId,
    _id: req.params.id,
  });

  if (!item) {
    return fail(res, "Cart item not found.", 404);
  }

  ok(res, null, "Cart item removed.");
}

async function clear(req, res) {
  const userId = req.auth.id;

  await CartItem.deleteMany({
    userId,
  });

  ok(res, null, "Cart cleared.");
}

async function internalCart(req, res) {
  const items = await CartItem.find({
    userId: req.params.userId,
  }).lean();

  ok(res, items);
}

async function internalClear(req, res) {
  await CartItem.deleteMany({
    userId: req.params.userId,
  });

  ok(res, null, "Cart cleared.");
}

module.exports = {
  getCart,
  add,
  update,
  remove,
  clear,
  internalCart,
  internalClear,
};
