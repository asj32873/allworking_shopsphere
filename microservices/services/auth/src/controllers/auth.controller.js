const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { postJson, getJson } = require("../utils/serviceClient");
const { ok, fail } = require("../utils/apiResponse");
function publicUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    auth0Sub: u.auth0Sub,
  };
}
function tokenFor(u) {
  return jwt.sign(
    { id: u._id.toString(), role: u.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}
async function register(req, res) {
  const { name, email, phone, password } = req.body;
  const e = email.toLowerCase();
  if (await User.exists({ email: e }))
    return fail(res, "Email already exists.", 409);
  const u = await User.create({
    name,
    email: e,
    phone,
    passwordHash: await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT_ROUNDS || 12),
    ),
    role: "USER",
  });
  ok(res, { user: publicUser(u), token: tokenFor(u) }, "Account created.", 201);
}
async function registerVendor(req, res) {
  const { ownerName, storeName, email, phone, storeAddress, password } =
    req.body;
  const e = email.toLowerCase();
  if (await User.exists({ email: e }))
    return fail(res, "Email already exists.", 409);
  const u = await User.create({
    name: ownerName,
    email: e,
    phone,
    passwordHash: await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT_ROUNDS || 12),
    ),
    role: "VENDOR",
  });
  const vr = await postJson(
    process.env.VENDOR_SERVICE_URL || "http://localhost:5012",
    "/internal/vendors",
    {
      userId: u._id,
      storeName,
      email: e,
      phone,
      storeAddress,
      status: "APPLIED",
    },
  );
  if (!vr.ok) {
    await User.findByIdAndDelete(u._id);
    return res.status(vr.status).json(vr.data);
  }
  ok(
    res,
    { user: publicUser(u), vendor: vr.data.data },
    "Vendor application submitted.",
    201,
  );
}
async function login(req, res) {
  const { email, password } = req.body;
  const u = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+passwordHash",
  );
  if (!u || !u.passwordHash) return fail(res, "Invalid credentials.", 401);
  if (u.status === "DISABLED") return fail(res, "Account disabled.", 403);
  if (!(await bcrypt.compare(password, u.passwordHash)))
    return fail(res, "Invalid credentials.", 401);
  if (u.role === "VENDOR") {
    const vr = await getJson(
      process.env.VENDOR_SERVICE_URL || "http://localhost:5012",
      `/internal/vendors/by-user/${u._id}`,
    );
    const v = vr.data?.data;
    if (!vr.ok || !v || v.status !== "VERIFIED")
      return fail(res, "Vendor is not verified yet.", 403);
  }
  ok(res, { user: publicUser(u), token: tokenFor(u) }, "Login successful.");
}
async function me(req, res) {
  ok(res, req.user);
}
async function internalUser(req, res) {
  const u = await User.findById(req.params.id).lean();
  if (!u) return fail(res, "User not found.", 404);
  delete u.passwordHash;
  ok(res, u);
}
async function internalUsers(req, res) {
  const users = await User.find()
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .lean();
  ok(res, users);
}
async function internalUsers(req, res) {
  const users = await User.find()
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .lean();
  ok(res, users);
}
async function updateInternal(req, res) {
  const allowed = ["name", "phone", "status", "role"];
  const updates = {};
  for (const k of allowed)
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  const u = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).lean();
  if (!u) return fail(res, "User not found.", 404);
  delete u.passwordHash;
  ok(res, u);
}
module.exports = {
  register,
  registerVendor,
  login,
  me,
  internalUser,
  internalUsers,
  updateInternal,
};
