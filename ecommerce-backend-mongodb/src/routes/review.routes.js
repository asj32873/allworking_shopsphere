const router = require("express").Router();
const controller = require("../controllers/review.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/product/:productId", controller.listForProduct);

router.post(
  "/product/:productId",
  authenticate,
  authorize("USER"),
  controller.create,
);

router.put("/:id", authenticate, authorize("USER"), controller.update);

router.delete(
  "/:id",
  authenticate,
  authorize("USER", "ADMIN"),
  controller.remove,
);

module.exports = router;
