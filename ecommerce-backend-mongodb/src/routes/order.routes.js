const router = require("express").Router();
const controller = require("../controllers/order.controller");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { createOrderSchema, statusSchema } = require("../validators/order");

router.post("/", authenticate, authorize("USER"), validate(createOrderSchema), controller.createOrder);

router.get("/", authenticate, authorize("USER"), controller.listMyOrders);

router.get("/vendor/list", authenticate, authorize("VENDOR"), controller.vendorList);

router.patch(
  "/vendor/:orderId/items/:itemId/status",
  authenticate,
  authorize("VENDOR"),
  validate(statusSchema),
  controller.vendorUpdateStatus
);

router.get("/admin/list", authenticate, authorize("ADMIN"), controller.adminList);

router.patch(
  "/admin/:orderId/items/:itemId/status",
  authenticate,
  authorize("ADMIN"),
  validate(statusSchema),
  controller.adminUpdateStatus
);

router.get("/:id", authenticate, authorize("USER", "VENDOR", "ADMIN"), controller.getById);

router.get(
  "/:id/tracking",
  authenticate,
  authorize("USER", "VENDOR", "ADMIN"),
  controller.tracking
);
module.exports = router;
