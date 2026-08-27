const router = require("express").Router();
const controller = require("../controllers/cart.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("USER"));
router.get("/", controller.getCart);
router.post("/items", controller.addItem);
router.patch("/items/:id", controller.updateItem);
router.delete("/items/:id", controller.removeItem);

module.exports = router;
