const router = require("express").Router();

console.log("========== MAIN ROUTER LOADED ==========");

router.post("/debug", (req, res) => {
  console.log("🔥 MAIN ROUTER DEBUG HIT");

  res.json({
    success: true,
    message: "Main router works",
  });
});

router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/products", require("./product.routes"));
router.use("/addresses", require("./address.routes"));
router.use("/cart", require("./cart.routes"));
router.use("/orders", require("./order.routes"));

console.log("MOUNTING PAYMENT ROUTES");

router.use("/payments", require("./payment.routes"));

router.use("/reviews", require("./review.routes"));
router.use("/issues", require("./issue.routes"));
router.use("/vendor", require("./vendor.routes"));
router.use("/admin", require("./admin.routes"));

module.exports = router;
