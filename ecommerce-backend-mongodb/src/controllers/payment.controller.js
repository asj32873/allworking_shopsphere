const stripe = require("../services/stripe.service");

const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const Address = require("../models/Address");
const Payment = require("../models/Payment");

const { createOrderForUser } = require("./order.controller");

const { ok, fail } = require("../utils/apiResponse");

async function createCheckoutSession(req, res) {
  try {
    console.log("===== CREATE CHECKOUT SESSION =====");
    console.log("User:", req.user?._id);
    console.log("Email:", req.user?.email);
    console.log("Body:", req.body);
    console.log("STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);
    console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

    const { addressId } = req.body;

    const address = await Address.findOne({
      _id: addressId,
      userId: req.user._id,
    });

    if (!address) {
      return fail(res, "Delivery address not found.", 404);
    }

    const cart = await CartItem.find({
      userId: req.user._id,
    })
      .populate("productId")
      .lean();

    console.log("Cart items:", cart.length);

    if (!cart.length) {
      return fail(res, "Cart is empty.", 400);
    }

    for (const item of cart) {
      const product = item.productId;

      if (!product) {
        return fail(res, "A product in your cart no longer exists.", 409);
      }

      if (product.stock < item.quantity) {
        return fail(
          res,
          `Only ${product.stock} item(s) of ${product.name} are available.`,
          409,
        );
      }
    }

    const lineItems = cart.map((item) => {
      const product = item.productId;

      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: product.name,
            description: product.description?.slice(0, 500) || undefined,
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      };
    });

    console.log("Stripe line items:", lineItems);
    console.log("Creating Stripe Checkout Session...");

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: req.user.email,

      metadata: {
        userId: req.user._id.toString(),
        addressId: address._id.toString(),
      },

      success_url:
        `${process.env.FRONTEND_URL}/payment/success` +
        "?session_id={CHECKOUT_SESSION_ID}",

      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,

      submit_type: "pay",
      payment_method_types: ["card"],
    });

    console.log("Stripe session created:", checkoutSession.id);

    const totalAmount = cart.reduce(
      (sum, item) => sum + item.quantity * item.productId.price,
      0,
    );

    await Payment.create({
      userId: req.user._id,
      addressId: address._id,
      stripeSessionId: checkoutSession.id,
      amount: totalAmount,
      currency: "inr",
      status: "PENDING",
    });

    console.log("Payment record created.");

    return ok(res, {
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("===== CHECKOUT SESSION ERROR =====");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
    console.error("Type:", error.type);
    console.error("Code:", error.code);
    console.error("Raw:", error.raw);
    console.error("Stack:", error.stack);
    console.error("=================================");

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create checkout session.",
    });
  }
}

async function stripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:");
    console.error(error.message);

    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      // ------------------------------------------------
      // Successful Checkout payment
      // ------------------------------------------------

      case "checkout.session.completed": {
        const checkoutSession = event.data.object;

        if (checkoutSession.payment_status !== "paid") {
          break;
        }

        const { userId, addressId } = checkoutSession.metadata || {};

        if (!userId || !addressId) {
          console.error("Stripe session missing metadata:", checkoutSession.id);

          break;
        }

        // ----------------------------------------------
        // Find payment
        // ----------------------------------------------

        const payment = await Payment.findOne({
          stripeSessionId: checkoutSession.id,
        });

        if (!payment) {
          console.error("Payment record not found:", checkoutSession.id);

          break;
        }

        // ----------------------------------------------
        // Idempotency
        // ----------------------------------------------

        if (payment.status === "PAID") {
          console.log("Payment already processed:", checkoutSession.id);

          break;
        }

        // ----------------------------------------------
        // Mark payment paid
        // ----------------------------------------------

        payment.status = "PAID";
        payment.stripePaymentIntentId = checkoutSession.payment_intent;

        await payment.save();

        // ----------------------------------------------
        // Create actual ShopSphere order
        // ----------------------------------------------

        try {
          const order = await createOrderForUser({
            userId,
            addressId,
            stripeSessionId: checkoutSession.id,
            stripePaymentIntentId: checkoutSession.payment_intent,
          });

          payment.orderId = order.id;
          await payment.save();

          console.log("ShopSphere order created:", order.id);
        } catch (orderError) {
          console.error(
            "Payment succeeded but order creation failed:",
            orderError,
          );

          // Don't pretend payment failed.
          // Payment remains PAID and needs reconciliation.
        }

        break;
      }

      // ------------------------------------------------
      // Async payment failure
      // ------------------------------------------------

      case "checkout.session.async_payment_failed": {
        const checkoutSession = event.data.object;

        await Payment.findOneAndUpdate(
          {
            stripeSessionId: checkoutSession.id,
          },
          {
            status: "FAILED",
          },
        );

        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return res.json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed.",
    });
  }
}

module.exports = {
  createCheckoutSession,
  stripeWebhook,
};
