const router = require("express").Router();
const c = require("../controllers/address.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { internal } = require("@shopsphere/common");
router.get("/api/addresses", authenticate, authorize("USER"), c.list);
router.post("/api/addresses", authenticate, authorize("USER"), c.create);
router.put("/api/addresses/:id", authenticate, authorize("USER"), c.update);
router.delete("/api/addresses/:id", authenticate, authorize("USER"), c.remove);
router.patch(
  "/api/addresses/:id/default",
  authenticate,
  authorize("USER"),
  c.setDefault,
);
router.get("/internal/addresses/:userId/:id", internal, c.internalGet);
module.exports = router;
