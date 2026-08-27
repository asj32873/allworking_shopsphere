const router = require("express").Router();

const controller = require("../controllers/payment.controller");
const { authenticate, authorize } = require("../middleware/auth");

console.log("PAYMENT ROUTES LOADED");

router.post("/debug", (req, res) => {
  console.log("🔥 PAYMENT ROUTER DEBUG HIT");

  res.json({
    success: true,
    message: "Payment router works",
  });
});

router.post(
  "/create-checkout-session",
  authenticate,
  authorize("USER"),
  controller.createCheckoutSession,
);

module.exports = router;
