const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const History = require("../models/OrderStatusHistory");
const { getJson, postJson } = require("../utils/serviceClient");
const { ok, fail } = require("../utils/apiResponse");
const CART = () => process.env.CART_SERVICE_URL || "http://localhost:5004";
const PRODUCT = () =>
  process.env.PRODUCT_SERVICE_URL || "http://localhost:5003";
const ADDRESS = () =>
  process.env.ADDRESS_SERVICE_URL || "http://localhost:5008";
async function createOrder(req, res) {
  const { addressId } = req.body;
  const ar = await getJson(
    ADDRESS(),
    `/internal/addresses/${req.user.id}/${addressId}`,
  );
  if (!ar.ok) return fail(res, "Delivery address not found.", 404);
  const cr = await getJson(CART(), `/internal/cart/${req.user.id}`);
  const cart = cr.data?.data || [];
  if (!cart.length) return fail(res, "Cart is empty.", 400);
  const items = [];
  for (const i of cart) {
    const pr = await getJson(PRODUCT(), `/internal/products/${i.productId}`);
    const p = pr.data?.data;
    if (!p) return fail(res, "A product in your cart no longer exists.", 409);
    if (p.stock < i.quantity)
      return fail(
        res,
        `Only ${p.stock} item(s) of ${p.name} are available.`,
        409,
      );
    items.push({
      productId: p._id,
      vendorId: p.vendorId,
      name: p.name,
      quantity: i.quantity,
      unitPrice: p.price,
    });
  }
  const reserve = await postJson(PRODUCT(), "/internal/products/reserve", {
    items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  });
  if (!reserve.ok) return res.status(reserve.status).json(reserve.data);
  try {
    const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const order = await Order.create({
      userId: req.user.id,
      addressId,
      totalAmount: total,
      paymentStatus: "PAID",
      paymentMethod: "STRIPE_TEST",
    });
    const docs = await OrderItem.insertMany(
      items.map((i) => ({ ...i, orderId: order._id })),
    );
    await History.create({
      orderId: order._id,
      status: "PLACED",
      updatedBy: req.user.id,
      remarks: "Order created",
    });
    await postJson(CART(), `/internal/cart/${req.user.id}/clear`, {});
    ok(res, { order, items: docs }, "Order created.", 201);
  } catch (e) {
    await postJson(PRODUCT(), "/internal/products/release", { items });
    throw e;
  }
}
async function listMyOrders(req, res) {
  try {
    const userId = req.auth?.id || req.user?._id?.toString() || req.user?.id;

    console.log("========== MY ORDERS ==========");
    console.log("req.auth:", req.auth);
    console.log("req.user:", req.user);
    console.log("Searching orders for userId:", userId);

    if (!userId) {
      return fail(res, "Authenticated user ID not found.", 401);
    }

    const orders = await Order.find({
      userId: userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log("Orders found:", orders.length);
    console.log("Orders:", orders);

    return ok(res, orders, "Orders fetched successfully.");
  } catch (error) {
    console.error("LIST MY ORDERS ERROR:", error);

    return fail(res, error.message || "Failed to fetch orders.", 500);
  }
}
async function getById(req, res) {
  const o = await Order.findById(req.params.id).lean();
  if (!o) return fail(res, "Order not found.", 404);
  if (
    req.user.role === "USER" &&
    o.userId.toString() !== req.user.id.toString()
  )
    return fail(res, "Order not found.", 404);
  const items = await OrderItem.find({ orderId: o._id }).lean();
  ok(res, { ...o, items });
}
async function tracking(req, res) {
  const o = await Order.findById(req.params.id).lean();
  if (!o) return fail(res, "Order not found.", 404);
  if (
    req.user.role === "USER" &&
    o.userId.toString() !== req.user.id.toString()
  )
    return fail(res, "Order not found.", 404);
  ok(res, {
    order: o,
    history: await History.find({ orderId: o._id })
      .sort({ timestamp: 1 })
      .lean(),
  });
}
async function vendorList(req, res) {
  const items = await OrderItem.find({ vendorId: req.user.id }).lean();
  const ids = [...new Set(items.map((i) => i.orderId.toString()))];
  ok(res, await Order.find({ _id: { $in: ids } }).sort({ createdAt: -1 }));
}
async function vendorUpdateStatus(req, res) {
  const item = await OrderItem.findOne({
    _id: req.params.itemId,
    orderId: req.params.orderId,
    vendorId: req.user.id,
  });
  if (!item) return fail(res, "Order item not found.", 404);
  item.vendorStatus = req.body.status;
  await item.save();
  await History.create({
    orderId: item.orderId,
    orderItemId: item._id,
    status: item.vendorStatus,
    updatedBy: req.user.id,
    remarks: req.body.remarks,
  });
  await refreshOrderStatus(item.orderId);
  ok(res, item, "Order item status updated.");
}
async function adminList(req, res) {
  ok(res, await Order.find().sort({ createdAt: -1 }));
}
async function adminUpdateStatus(req, res) {
  const item = await OrderItem.findOne({
    _id: req.params.itemId,
    orderId: req.params.orderId,
  });
  if (!item) return fail(res, "Order item not found.", 404);
  item.vendorStatus = req.body.status;
  await item.save();
  await History.create({
    orderId: item.orderId,
    orderItemId: item._id,
    status: item.vendorStatus,
    updatedBy: req.user.id,
    remarks: req.body.remarks,
  });
  await refreshOrderStatus(item.orderId);
  ok(res, item, "Order item status updated.");
}
async function refreshOrderStatus(orderId) {
  const items = await OrderItem.find({ orderId }).lean();
  if (!items.length) return;
  const statuses = items.map((i) => i.vendorStatus);
  let status = "PLACED";
  if (statuses.every((s) => s === "DELIVERED")) status = "DELIVERED";
  else if (statuses.some((s) => s === "OUT_FOR_DELIVERY"))
    status = "OUT_FOR_DELIVERY";
  else if (statuses.some((s) => s === "DISPATCHED")) status = "DISPATCHED";
  else if (statuses.some((s) => s === "PACKED")) status = "PACKED";
  else if (statuses.some((s) => s === "CONFIRMED")) status = "CONFIRMED";
  else if (statuses.every((s) => s === "CANCELLED")) status = "CANCELLED";
  await Order.findByIdAndUpdate(orderId, { status });
}
async function internalCreatePaid(req, res) {
  const {
    userId,
    addressId,
    totalAmount,
    items,
    stripeSessionId,
    stripePaymentIntentId,
  } = req.body;
  const order = await Order.create({
    userId,
    addressId,
    totalAmount,
    paymentStatus: "PAID",
    paymentMethod: "STRIPE_TEST",
    stripeSessionId,
    stripePaymentIntentId,
  });
  const docs = await OrderItem.insertMany(
    items.map((i) => ({ ...i, orderId: order._id })),
  );
  await History.create({
    orderId: order._id,
    status: "PLACED",
    updatedBy: userId,
    remarks: "Stripe payment confirmed",
  });
  ok(res, { order, items: docs }, "Order created.", 201);
}
async function internalReviewEligibility(req, res) {
  const orderIds = await Order.find({
    userId: req.params.userId,
    status: "DELIVERED",
  }).distinct("_id");
  const exists = await OrderItem.exists({
    orderId: { $in: orderIds },
    productId: req.params.productId,
  });
  ok(res, { eligible: Boolean(exists) });
}
async function internalVendorOrders(req, res) {
  const ids = await OrderItem.find({ vendorId: req.params.vendorId }).distinct(
    "orderId",
  );
  ok(res, ids);
}
async function internalVendorItems(req, res) {
  ok(res, await OrderItem.find({ vendorId: req.params.vendorId }).lean());
}
module.exports = {
  createOrder,
  listMyOrders,
  getById,
  tracking,
  vendorList,
  vendorUpdateStatus,
  adminList,
  adminUpdateStatus,
  internalCreatePaid,
  internalReviewEligibility,
  internalVendorOrders,
  internalVendorItems,
};
