const router = require("express").Router();

const controller = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");

const {
  registerSchema,
  vendorRegisterSchema,
  loginSchema,
} = require("../validators/auth");

/*
 * Legacy email/password registration.
 */
router.post("/register", validate(registerSchema), controller.register);

/*
 * Vendor registration remains part of ShopSphere.
 */
router.post(
  "/vendor/register",
  validate(vendorRegisterSchema),
  controller.registerVendor,
);

/*
 * Legacy email/password login remains available.
 */
router.post("/login", validate(loginSchema), controller.login);

/*
 * Auth0 social login does NOT need a separate login endpoint.
 *
 * React Auth0 SDK obtains an Auth0 access token and sends:
 *
 * Authorization: Bearer <AUTH0_ACCESS_TOKEN>
 *
 * to this endpoint.
 */
router.get("/me", authenticate, controller.me);

/*
 * Auth0 logout happens in the frontend.
 *
 * This endpoint remains for compatibility with the existing
 * application.
 */
router.post("/logout", authenticate, (req, res) =>
  res.json({
    success: true,
    message: "Logged out.",
  }),
);

module.exports = router;
