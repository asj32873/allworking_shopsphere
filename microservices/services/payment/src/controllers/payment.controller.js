const stripe = require("../services/stripe.service");
const Payment = require("../models/Payment");
const { getJson, postJson } = require("../utils/serviceClient");
const { ok, fail } = require("../utils/apiResponse");
const CART = () => process.env.CART_SERVICE_URL || "http://localhost:5004";
const PRODUCT = () =>
  process.env.PRODUCT_SERVICE_URL || "http://localhost:5003";
const ADDRESS = () =>
  process.env.ADDRESS_SERVICE_URL || "http://localhost:5008";
const ORDER = () => process.env.ORDER_SERVICE_URL || "http://localhost:5005";

async function createCheckoutSession(req, res) {
  if (!stripe) {
    return fail(res, "Stripe is not configured.", 503);
  }

  const { addressId } = req.body;

  if (!addressId) {
    return fail(res, "addressId is required.", 400);
  }

  const userId = req.auth?.id || req.user?._id?.toString() || req.user?.id;

  if (!userId) {
    return fail(res, "Authenticated user ID not found.", 401);
  }

  console.log("CHECKOUT REQUEST:", {
    userId,
    addressId,
  });

  // =========================
  // VERIFY DELIVERY ADDRESS
  // =========================

  const ar = await getJson(
    ADDRESS(),
    `/internal/addresses/${userId}/${addressId}`,
  );

  console.log("ADDRESS SERVICE RESPONSE:", {
    status: ar.status,
    ok: ar.ok,
    data: ar.data,
  });

  if (!ar.ok) {
    if (ar.status === 404) {
      return fail(res, "Delivery address not found.", 404);
    }

    return fail(
      res,
      ar.data?.message || "Unable to verify delivery address.",
      502,
    );
  }

  // =========================
  // GET CART
  // =========================

  const cr = await getJson(CART(), `/internal/cart/${userId}`);

  const cart = cr.data?.data || [];

  if (!cart.length) {
    return fail(res, "Cart is empty.", 400);
  }

  // =========================
  // GET PRODUCTS
  // =========================

  const lineItems = [];
  const orderItems = [];
  let total = 0;

  for (const i of cart) {
    const pr = await getJson(PRODUCT(), `/internal/products/${i.productId}`);

    const p = pr.data?.data;

    if (!p) {
      return fail(res, "A product in your cart no longer exists.", 409);
    }

    if (p.stock < i.quantity) {
      return fail(
        res,
        `Only ${p.stock} item(s) of ${p.name} are available.`,
        409,
      );
    }

    lineItems.push({
      price_data: {
        currency: "inr",
        product_data: {
          name: p.name,
          description: p.description?.slice(0, 500) || undefined,
        },
        unit_amount: Math.round(p.price * 100),
      },
      quantity: i.quantity,
    });

    orderItems.push({
      productId: p._id,
      vendorId: p.vendorId,
      name: p.name,
      quantity: i.quantity,
      unitPrice: p.price,
    });

    total += i.quantity * p.price;
  }

  // =========================
  // CREATE STRIPE SESSION
  // =========================

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,

    customer_email: req.user.email,

    metadata: {
      userId: String(userId),
      addressId: String(addressId),
    },

    success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,

    submit_type: "pay",

    payment_method_types: ["card"],
  });

  // =========================
  // SAVE PAYMENT
  // =========================

  await Payment.create({
    userId,
    addressId,
    stripeSessionId: session.id,
    amount: total,
    currency: "inr",
    status: "PENDING",
  });

  return ok(
    res,
    {
      sessionId: session.id,
      url: session.url,
      orderItems,
    },
    "Checkout session created.",
  );
}

async function webhook(req, res) {
  if (!stripe)
    return res
      .status(503)
      .json({ success: false, message: "Stripe is not configured." });
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    return res
      .status(400)
      .json({ success: false, message: `Webhook Error: ${e.message}` });
  }
  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const payment = await Payment.findOneAndUpdate(
      { stripeSessionId: s.id },
      { status: "PAID", stripePaymentIntentId: s.payment_intent },
      { new: true },
    );
    if (payment && !payment.orderId) {
      try {
        const cr = await getJson(CART(), `/internal/cart/${payment.userId}`);
        const cart = cr.data?.data || [];

        console.log("CART:", cart);

        const items = [];

        for (const i of cart) {
          const pr = await getJson(
            PRODUCT(),
            `/internal/products/${i.productId}`,
          );

          const p = pr.data?.data;

          if (p) {
            items.push({
              productId: p._id,
              vendorId: p.vendorId,
              name: p.name,
              quantity: i.quantity,
              unitPrice: p.price,
            });
          }
        }

        console.log("ORDER ITEMS:", items);

        if (!items.length) {
          console.error("ORDER CREATION FAILED: No items found");
          return res.json({ received: true });
        }

        const reserve = await postJson(
          PRODUCT(),
          "/internal/products/reserve",
          {
            items: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          },
        );

        console.log("RESERVE RESPONSE:", reserve);

        if (!reserve.ok) {
          console.error("STOCK RESERVATION FAILED:", reserve.data);
          return res.json({ received: true });
        }

        const orderResult = await postJson(ORDER(), "/internal/orders/paid", {
          userId: payment.userId,
          addressId: payment.addressId,
          totalAmount: payment.amount,
          items,
          stripeSessionId: s.id,
          stripePaymentIntentId: s.payment_intent,
        });

        console.log("ORDER RESPONSE:", orderResult);

        if (!orderResult.ok) {
          console.error("ORDER CREATION FAILED:", orderResult.data);
          return res.json({ received: true });
        }

        payment.orderId = orderResult.data.data.order._id;
        await payment.save();

        await postJson(CART(), `/internal/cart/${payment.userId}/clear`, {});

        console.log("ORDER CREATED SUCCESSFULLY:", payment.orderId);
      } catch (error) {
        console.error("WEBHOOK ORDER ERROR:", error);
      }
    }
  }
  if (event.type === "checkout.session.expired") {
    await Payment.findOneAndUpdate(
      { stripeSessionId: event.data.object.id },
      { status: "CANCELLED" },
    );
  }
  res.json({ received: true });
}
async function debug(req, res) {
  res.json({ success: true, message: "Payment router works" });
}
module.exports = { createCheckoutSession, webhook, debug };
