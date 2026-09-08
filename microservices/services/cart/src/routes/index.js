const router = require("express").Router();

const c = require("../controllers/cart.controller");

const { authenticate, authorize } = require("../middleware/auth");

const { internal } = require("@shopsphere/common");

// GET CART
router.get("/api/cart", authenticate, authorize("USER"), c.getCart);

// ADD ITEM
router.post("/api/cart/items", authenticate, authorize("USER"), c.add);

// UPDATE ITEM
router.patch("/api/cart/items/:id", authenticate, authorize("USER"), c.update);

// DELETE ITEM
router.delete("/api/cart/items/:id", authenticate, authorize("USER"), c.remove);

// CLEAR CART
router.delete("/api/cart", authenticate, authorize("USER"), c.clear);

// INTERNAL ROUTES
router.get("/internal/cart/:userId", internal, c.internalCart);

router.post("/internal/cart/:userId/clear", internal, c.internalClear);

module.exports = router;
