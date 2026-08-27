const router = require("express").Router();
const controller = require("../controllers/vendor.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("VENDOR"));
router.get("/profile", controller.profile);
router.get("/dashboard", controller.dashboard);

module.exports = router;
