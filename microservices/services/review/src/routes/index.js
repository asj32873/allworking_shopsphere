const router = require("express").Router();
const c = require("../controllers/review.controller");
const { authenticate, authorize } = require("../middleware/auth");
router.get("/api/reviews/product/:productId", c.listForProduct);
router.post(
  "/api/reviews/product/:productId",
  authenticate,
  authorize("USER"),
  c.create,
);
router.put("/api/reviews/:id", authenticate, authorize("USER"), c.update);
router.delete(
  "/api/reviews/:id",
  authenticate,
  authorize("USER", "ADMIN"),
  c.remove,
);

module.exports = router;
