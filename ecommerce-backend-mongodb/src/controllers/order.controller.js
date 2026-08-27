const mongoose = require("mongoose");
const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const OrderStatusHistory = require("../models/OrderStatusHistory");
const Address = require("../models/Address");
const { ok, fail } = require("../utils/apiResponse");
const { VENDOR_NEXT_STATUS } = require("../utils/status");

class OrderError extends Error {
  constructor(message, status = 400, details = null) {
    super(message);
    this.name = "OrderError";
    this.status = status;
    this.details = details;
  }
}

async function createOrderForUser({
  userId,
  addressId,
  stripeSessionId = null,
  stripePaymentIntentId = null,
}) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // --------------------------------------------------
    // 1. Validate address
    // --------------------------------------------------

    const address = await Address.findOne({
      _id: addressId,
      userId,
    }).session(session);

    if (!address) {
      throw new Error("Delivery address not found.");
    }

    // --------------------------------------------------
    // 2. Get cart
    // --------------------------------------------------

    const cart = await CartItem.find({
      userId,
    })
      .populate("productId")
      .session(session);

    if (!cart.length) {
      throw new Error("Cart is empty.");
    }

    // --------------------------------------------------
    // 3. Validate stock
    // --------------------------------------------------

    const unavailableItems = [];

    for (const item of cart) {
      const product = item.productId;

      if (!product) {
        unavailableItems.push({
          productId: item.productId,
          reason: "PRODUCT_NOT_FOUND",
        });

        continue;
      }

      if (product.stock === 0) {
        unavailableItems.push({
          productId: product._id,
          name: product.name,
          requestedQuantity: item.quantity,
          availableStock: 0,
          reason: "OUT_OF_STOCK",
        });

        continue;
      }

      if (item.quantity > product.stock) {
        unavailableItems.push({
          productId: product._id,
          name: product.name,
          requestedQuantity: item.quantity,
          availableStock: product.stock,
          reason: "INSUFFICIENT_STOCK",
        });
      }
    }

    if (unavailableItems.length) {
      const error = new Error(
        "Some items in your cart are no longer available.",
      );

      error.status = 409;
      error.details = { unavailableItems };

      throw error;
    }

    // --------------------------------------------------
    // 4. Calculate total from DB
    // --------------------------------------------------

    const totalAmount = cart.reduce(
      (sum, item) => sum + item.quantity * item.productId.price,
      0,
    );

    // --------------------------------------------------
    // 5. Prevent duplicate Stripe order
    // --------------------------------------------------

    if (stripeSessionId) {
      const existingOrder = await Order.findOne({
        stripeSessionId,
      }).session(session);

      if (existingOrder) {
        await session.commitTransaction();
        return existingOrder;
      }
    }

    // --------------------------------------------------
    // 6. Create order
    // --------------------------------------------------

    const [order] = await Order.create(
      [
        {
          userId,
          addressId,
          status: "PLACED",
          totalAmount,

          paymentStatus: "PAID",
          paymentMethod: "STRIPE_TEST",

          stripeSessionId,
          stripePaymentIntentId,

          orderedAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { session },
    );

    const history = [];

    // --------------------------------------------------
    // 7. Atomically decrement stock
    // --------------------------------------------------

    for (const item of cart) {
      const product = item.productId;

      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: product._id,
          stock: {
            $gte: item.quantity,
          },
        },
        {
          $inc: {
            stock: -item.quantity,
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!updatedProduct) {
        const error = new Error(
          `Stock changed while ordering "${product.name}".`,
        );

        error.status = 409;

        throw error;
      }

      const [orderItem] = await OrderItem.create(
        [
          {
            orderId: order._id,
            productId: product._id,
            vendorId: product.vendorId,
            name: product.name,
            quantity: item.quantity,
            unitPrice: product.price,
            vendorStatus: "PLACED",
          },
        ],
        { session },
      );

      history.push({
        orderId: order._id,
        orderItemId: orderItem._id,
        status: "PLACED",
        updatedBy: userId,
        remarks: "Payment successful. Order placed.",
      });
    }

    // --------------------------------------------------
    // 8. Tracking history
    // --------------------------------------------------

    await OrderStatusHistory.insertMany(history, {
      session,
    });

    // --------------------------------------------------
    // 9. Clear cart
    // --------------------------------------------------

    await CartItem.deleteMany(
      {
        userId,
      },
      {
        session,
      },
    );

    // --------------------------------------------------
    // 10. Commit
    // --------------------------------------------------

    await session.commitTransaction();

    return await getOrderObject(order._id, {
      _id: userId,
      role: "USER",
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

async function createOrder(req, res) {
  try {
    const order = await createOrderForUser({
      userId: req.user._id,
      addressId: req.body.addressId,
    });

    return ok(res, order, "Order placed successfully.", 201);
  } catch (error) {
    if (error.status) {
      return fail(res, error.message, error.status, error.details);
    }

    throw error;
  }
}

async function getOrderObject(orderId, requester) {
  const order = await Order.findById(orderId).populate("addressId").lean();
  if (!order) return null;

  let itemQuery = { orderId: order._id };
  if (requester.role === "VENDOR") itemQuery.vendorId = requester._id;

  const items = await OrderItem.find(itemQuery).lean();
  const itemIds = items.map((i) => i._id);
  const histories = await OrderStatusHistory.find({
    orderItemId: { $in: itemIds },
  })
    .sort({ timestamp: 1 })
    .lean();

  return {
    ...order,
    items: items.map((item) => ({
      ...item,
      tracking: histories
        .filter((h) => h.orderItemId.toString() === item._id.toString())
        .map((h) => ({
          status: h.status,
          date: h.timestamp,
          remarks: h.remarks,
        })),
    })),
  };
}

async function listMyOrders(req, res) {
  const orders = await Order.find({ userId: req.user._id })
    .sort({ orderedAt: -1 })
    .lean();
  const result = [];
  for (const order of orders) {
    result.push(await getOrderObject(order._id, req.user));
  }
  ok(res, result);
}

async function getById(req, res) {
  console.log("========== ORDER DETAILS ==========");
  console.log("req.params:", req.params);
  console.log("ID:", req.params.id);
  console.log("User:", req.user._id.toString());

  const order = await Order.findById(req.params.id);

  console.log("ORDER FOUND:", !!order);

  if (order) {
    console.log("DB ORDER ID:", order._id.toString());
    console.log("DB USER ID:", order.userId.toString());
  }

  console.log("===================================");

  if (!order) return fail(res, "Order not found.", 404);

  if (
    req.user.role === "USER" &&
    order.userId.toString() !== req.user._id.toString()
  ) {
    return fail(res, "Order not found.", 404);
  }

  if (req.user.role === "VENDOR") {
    const hasVendorItem = await OrderItem.exists({
      orderId: order._id,
      vendorId: req.user._id,
    });
    if (!hasVendorItem) return fail(res, "Order not found.", 404);
  }

  ok(res, await getOrderObject(order._id, req.user));
}

async function tracking(req, res) {
  const order = await Order.findById(req.params.id).lean();
  if (!order) return fail(res, "Order not found.", 404);

  if (
    req.user.role === "USER" &&
    order.userId.toString() !== req.user._id.toString()
  ) {
    return fail(res, "Order not found.", 404);
  }

  const items = await OrderItem.find({ orderId: order._id }).lean();
  const histories = await OrderStatusHistory.find({ orderId: order._id })
    .sort({ timestamp: 1 })
    .lean();

  ok(res, {
    orderId: order._id,
    items: items.map((item) => ({
      itemId: item._id,
      status: item.vendorStatus,
      tracking: histories.filter(
        (h) => h.orderItemId.toString() === item._id.toString(),
      ),
    })),
  });
}

async function vendorList(req, res) {
  const items = await OrderItem.find({ vendorId: req.user._id }).lean();
  const orderIds = [...new Set(items.map((i) => i.orderId.toString()))];
  const orders = await Order.find({ _id: { $in: orderIds } })
    .populate("userId", "name email phone")
    .sort({ orderedAt: -1 })
    .lean();

  ok(
    res,
    orders.map((order) => ({
      ...order,
      items: items.filter((i) => i.orderId.toString() === order._id.toString()),
    })),
  );
}

async function vendorUpdateStatus(req, res) {
  const { status, remarks } = req.body;
  const item = await OrderItem.findOne({
    _id: req.params.itemId,
    orderId: req.params.orderId,
    vendorId: req.user._id,
  });
  if (!item) return fail(res, "Order item not found for this vendor.", 404);

  const allowed = VENDOR_NEXT_STATUS[item.vendorStatus] || [];
  if (!allowed.includes(status)) {
    return fail(
      res,
      `Invalid vendor transition from ${item.vendorStatus} to ${status}.`,
      400,
    );
  }

  item.vendorStatus = status;
  await item.save();

  await OrderStatusHistory.create({
    orderId: item.orderId,
    orderItemId: item._id,
    status,
    updatedBy: req.user._id,
    remarks: remarks || `Vendor updated status to ${status}`,
  });

  await syncOrderStatus(item.orderId);
  ok(res, item, "Order item status updated.");
}

async function adminUpdateStatus(req, res) {
  const { status, remarks } = req.body;
  const item = await OrderItem.findOne({
    _id: req.params.itemId,
    orderId: req.params.orderId,
  });
  if (!item) return fail(res, "Order item not found.", 404);

  item.vendorStatus = status;
  await item.save();

  await OrderStatusHistory.create({
    orderId: item.orderId,
    orderItemId: item._id,
    status,
    updatedBy: req.user._id,
    remarks: remarks || `Admin updated status to ${status}`,
  });

  await syncOrderStatus(item.orderId);
  ok(res, item, "Order status updated.");
}

async function syncOrderStatus(orderId) {
  const items = await OrderItem.find({ orderId }).lean();
  if (!items.length) return;

  const statuses = items.map((i) => i.vendorStatus);
  let status = "PLACED";

  if (statuses.every((s) => s === "DELIVERED")) status = "DELIVERED";
  else if (statuses.every((s) => s === "OUT_FOR_DELIVERY" || s === "DELIVERED"))
    status = "OUT_FOR_DELIVERY";
  else if (
    statuses.every((s) =>
      ["DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(s),
    )
  )
    status = "DISPATCHED";
  else if (
    statuses.every((s) =>
      ["PACKED", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(s),
    )
  )
    status = "PACKED";
  else if (
    statuses.every((s) =>
      [
        "CONFIRMED",
        "PACKED",
        "DISPATCHED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(s),
    )
  )
    status = "CONFIRMED";
  else if (
    statuses.some((s) => s === "CANCELLED") &&
    statuses.every((s) => ["CANCELLED", "DELIVERED"].includes(s))
  )
    status = "CANCELLED";
  else status = "PLACED";

  await Order.findByIdAndUpdate(orderId, { status, updatedAt: new Date() });
}

async function adminList(req, res) {
  const orders = await Order.find()
    .populate("userId", "name email")
    .sort({ orderedAt: -1 })
    .lean();
  const ids = orders.map((o) => o._id);
  const items = await OrderItem.find({ orderId: { $in: ids } }).lean();
  ok(
    res,
    orders.map((o) => ({
      ...o,
      items: items.filter((i) => i.orderId.toString() === o._id.toString()),
    })),
  );
}

module.exports = {
  createOrder,
  createOrderForUser,
  listMyOrders,
  getById,
  tracking,
  vendorList,
  vendorUpdateStatus,
  adminUpdateStatus,
  adminList,
};
