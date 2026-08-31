const router = require("express").Router();
const c = require("../controllers/vendor.controller");
const { authenticate, authorize } = require("../middleware/auth");
const internal = require("../middleware/internal");
router.get("/api/vendor/profile", authenticate, authorize("VENDOR"), c.profile);
router.get(
  "/api/vendor/dashboard",
  authenticate,
  authorize("VENDOR"),
  c.dashboard,
);
router.post("/internal/vendors", internal, c.internalCreate);
router.get("/internal/vendors/by-user/:userId", internal, c.internalGetByUser);


router.get("/internal/vendors", internal, c.internalList);
router.patch("/internal/vendors/:id", internal, c.internalUpdate);
router.delete("/internal/vendors/:id", internal, c.internalRemove);
module.exports = router;
