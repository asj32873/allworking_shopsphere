const router = require("express").Router();
const controller = require("../controllers/address.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("USER"));
router.get("/", controller.list);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);
router.patch("/:id/default", controller.setDefault);

module.exports = router;
