const router = require("express").Router();

const controller = require("../controllers/issue.controller");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const internal = require("../middleware/internal");

const {
  createIssueSchema,
  updateIssueSchema,
} = require("../validators/issue");

/*
 * Internal service-to-service endpoint.
 *
 * IMPORTANT:
 * This must be registered BEFORE router.use(authenticate)
 * because internal services authenticate using
 * x-internal-service-token rather than a user JWT.
 */
router.get(
  "/internal/issues/vendor/:vendorId/count",
  internal,
  controller.internalVendorCount
);

/*
 * Public/API Gateway-facing support routes.
 */
router.use(authenticate);

router.post(
  "/api/issues",
  authorize("USER"),
  validate(createIssueSchema),
  controller.create
);

router.get(
  "/api/issues",
  authorize("USER", "VENDOR", "ADMIN"),
  controller.list
);

router.get(
  "/api/issues/:id",
  authorize("USER", "VENDOR", "ADMIN"),
  controller.getById
);

router.patch(
  "/api/issues/:id",
  authorize("USER", "VENDOR", "ADMIN"),
  validate(updateIssueSchema),
  controller.update
);

module.exports = router;


// const router = require("express").Router();
// const c = require("../controllers/issue.controller");
// const validate = require("../middleware/validate");
// const { authenticate, authorize } = require("../middleware/auth");
// const { createIssueSchema, updateIssueSchema } = require("../validators/issue");
// router.use(authenticate);
// router.post(
//   "/api/issues",
//   authorize("USER"),
//   validate(createIssueSchema),
//   c.create,
// );
// router.get("/api/issues", authorize("USER", "VENDOR", "ADMIN"), c.list);
// router.get("/api/issues/:id", authorize("USER", "VENDOR", "ADMIN"), c.getById);
// router.patch(
//   "/api/issues/:id",
//   authorize("USER", "VENDOR", "ADMIN"),
//   validate(updateIssueSchema),
//   c.update,
// );
// router.get(
//   "/internal/issues/vendor/:vendorId/count",
//   require("../middleware/internal"),
//   c.internalVendorCount,
// );
// module.exports = router;
