const router = require("express").Router();
const controller = require("../controllers/issue.controller");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { createIssueSchema, updateIssueSchema } = require("../validators/issue");

router.use(authenticate);
router.post("/", authorize("USER"), validate(createIssueSchema), controller.create);
router.get("/", authorize("USER", "VENDOR", "ADMIN"), controller.list);
router.get("/:id", authorize("USER", "VENDOR", "ADMIN"), controller.getById);
router.patch("/:id", authorize("USER", "VENDOR", "ADMIN"), validate(updateIssueSchema), controller.update);

module.exports = router;
