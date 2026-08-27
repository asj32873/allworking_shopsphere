const router = require("express").Router();
const controller = require("../controllers/admin.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("ADMIN"));

router.get("/dashboard", controller.dashboard);
router.get("/vendors", controller.vendors);
router.patch("/vendors/:id/approve", controller.approveVendor);
router.patch("/vendors/:id/reject", controller.rejectVendor);
router.delete("/vendors/:id", controller.deleteVendor);
router.get("/users", controller.users);
router.patch("/users/:id/status", controller.updateUserStatus);
router.get("/issues", controller.issues);

module.exports = router;
