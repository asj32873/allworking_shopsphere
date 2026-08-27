const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Vendor = require("../models/Vendor");

const { ok, fail } = require("../utils/apiResponse");

function tokenFor(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
  };
}

/*
 * ---------------------------------------------------------
 * LEGACY EMAIL/PASSWORD REGISTRATION
 * ---------------------------------------------------------
 */
async function register(req, res) {
  const { name, email, phone, password } = req.body;

  const normalizedEmail = email.toLowerCase();

  if (
    await User.exists({
      email: normalizedEmail,
    })
  ) {
    return fail(res, "Email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(
    password,
    Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  );

  const user = await User.create({
    name,
    email: normalizedEmail,
    phone,
    passwordHash,
    role: "USER",
  });

  ok(
    res,
    {
      user: publicUser(user),
      token: tokenFor(user),
    },
    "Account created.",
    201,
  );
}

/*
 * ---------------------------------------------------------
 * VENDOR REGISTRATION
 * ---------------------------------------------------------
 */
async function registerVendor(req, res) {
  const { ownerName, storeName, email, phone, storeAddress, password } =
    req.body;

  const normalizedEmail = email.toLowerCase();

  if (
    await User.exists({
      email: normalizedEmail,
    })
  ) {
    return fail(res, "Email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(
    password,
    Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  );

  const user = await User.create({
    name: ownerName,
    email: normalizedEmail,
    phone,
    passwordHash,
    role: "VENDOR",
    status: "ACTIVE",
  });

  const vendor = await Vendor.create({
    userId: user._id,
    storeName,
    email: normalizedEmail,
    phone,
    storeAddress,
    status: "APPLIED",
  });

  ok(
    res,
    {
      user: publicUser(user),
      vendor,
    },
    "Vendor application submitted.",
    201,
  );
}

/*
 * ---------------------------------------------------------
 * LEGACY EMAIL/PASSWORD LOGIN
 * ---------------------------------------------------------
 */
async function login(req, res) {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+passwordHash");

  if (!user || !user.passwordHash) {
    return fail(res, "Invalid credentials.", 401);
  }

  if (user.status === "DISABLED") {
    return fail(res, "Account disabled.", 403);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    return fail(res, "Invalid credentials.", 401);
  }

  if (user.role === "VENDOR") {
    const vendor = await Vendor.findOne({
      userId: user._id,
    });

    if (!vendor || vendor.status !== "VERIFIED") {
      return fail(res, "Vendor is not verified yet.", 403);
    }
  }

  ok(
    res,
    {
      user: publicUser(user),
      token: tokenFor(user),
    },
    "Login successful.",
  );
}

/*
 * ---------------------------------------------------------
 * CURRENT USER
 *
 * For Auth0:
 *   req.user was populated by middleware.
 *
 * For legacy JWT:
 *   req.user was also populated by middleware.
 * ---------------------------------------------------------
 */
async function me(req, res) {
  const user = req.user.toObject();

  if (user.role === "VENDOR") {
    user.vendor = await Vendor.findOne({
      userId: user._id,
    });
  }

  delete user.passwordHash;

  ok(res, user);
}

module.exports = {
  register,
  registerVendor,
  login,
  me,
};
