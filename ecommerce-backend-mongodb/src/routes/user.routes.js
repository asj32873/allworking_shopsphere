const router = require("express").Router();
const User = require("../models/User");
const { authenticate, authorize } = require("../middleware/auth");
const { ok, fail } = require("../utils/apiResponse");

router.get("/me", authenticate, authorize("USER"), async (req, res) => ok(res, req.user));

router.patch("/me", authenticate, async (req, res) => {
  const allowed = ["name", "phone"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-passwordHash");
  if (!user) return fail(res, "User not found.", 404);
  ok(res, user, "Profile updated.");
});

module.exports = router;
