const router = require("express").Router();
const controller = require("../controllers/product.controller");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { productSchema } = require("../validators/product");
const qaController = require("../controllers/productQA.controller");

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/:id/qa", qaController.askProductQuestion);
router.post(
  "/",
  authenticate,
  authorize("VENDOR"),
  validate(productSchema),
  controller.create,
);
router.put(
  "/:id",
  authenticate,
  authorize("VENDOR"),
  validate(productSchema.partial()),
  controller.update,
);
router.delete("/:id", authenticate, authorize("VENDOR"), controller.remove);
router.patch(
  "/:id/stock",
  authenticate,
  authorize("VENDOR"),
  controller.updateStock,
);

module.exports = router;
