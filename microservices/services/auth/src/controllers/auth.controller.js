const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const { postJson, getJson } = require("../utils/serviceClient");

const { ok, fail } = require("../utils/apiResponse");

const { verifyAuth0Token, getAuth0UserInfo } = require("../utils/auth0");

/*
 * Convert database user into
 * safe public response.
 */

function publicUser(u) {
  return {
    id: u._id.toString(),

    name: u.name,

    email: u.email,

    phone: u.phone,

    role: u.role,

    status: u.status,

    hasPassword: Boolean(u.passwordHash),

    auth0Sub: u.auth0Sub || null,
  };
}

/*
 * Generate ShopSphere JWT.
 *
 * This is the ONLY token used by:
 *
 * - Gateway
 * - Product Service
 * - Cart Service
 * - Order Service
 * - Vendor Service
 * - Payment Service
 * - Other microservices
 */

function tokenFor(u) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: u._id.toString(),

      role: u.role,

      type: "shopsphere",
    },

    process.env.JWT_SECRET,

    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",

      algorithm: "HS256",
    },
  );
}

/* =====================================================
   NORMAL USER REGISTRATION
===================================================== */

async function register(req, res) {
  const { name, email, phone, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const exists = await User.exists({
    email: normalizedEmail,
  });

  if (exists) {
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

  return ok(
    res,

    {
      user: publicUser(user),

      token: tokenFor(user),
    },

    "Account created.",

    201,
  );
}

/* =====================================================
   VENDOR REGISTRATION
===================================================== */

async function registerVendor(req, res) {
  const { ownerName, storeName, email, phone, storeAddress, password } =
    req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const exists = await User.exists({
    email: normalizedEmail,
  });

  if (exists) {
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
  });

  const vendorResponse = await postJson(
    process.env.VENDOR_SERVICE_URL || "http://localhost:5012",

    "/internal/vendors",

    {
      userId: user._id,

      storeName,

      email: normalizedEmail,

      phone,

      storeAddress,

      status: "APPLIED",
    },
  );

  /*
   * Roll back user creation if
   * vendor service fails.
   */

  if (!vendorResponse.ok) {
    await User.findByIdAndDelete(user._id);

    return res.status(vendorResponse.status).json(vendorResponse.data);
  }

  return ok(
    res,

    {
      user: publicUser(user),

      vendor: vendorResponse.data?.data,
    },

    "Vendor application submitted.",

    201,
  );
}

/* =====================================================
   EMAIL / PASSWORD LOGIN
===================================================== */

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

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return fail(res, "Invalid credentials.", 401);
  }

  /*
   * Vendor accounts must be verified.
   */

  if (user.role === "VENDOR") {
    const vendorResponse = await getJson(
      process.env.VENDOR_SERVICE_URL || "http://localhost:5012",

      `/internal/vendors/by-user/${user._id}`,
    );

    const vendor = vendorResponse.data?.data;

    if (!vendorResponse.ok || !vendor || vendor.status !== "VERIFIED") {
      return fail(res, "Vendor is not verified yet.", 403);
    }
  }

  return ok(
    res,

    {
      user: publicUser(user),

      token: tokenFor(user),
    },

    "Login successful.",
  );
}

/* =====================================================
   AUTH0 / GOOGLE LOGIN
===================================================== */

async function auth0Login(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return fail(res, "Auth0 access token is required.", 400);
    }

    /*
     * STEP 1
     *
     * Verify Auth0 Access Token.
     *
     * Verification checks:
     *
     * - RS256
     * - Auth0 JWKS
     * - issuer
     * - audience
     */

    const tokenIdentity = await verifyAuth0Token(token);

    /*
     * Auth0 subject is required.
     */

    const auth0Sub = tokenIdentity?.sub;

    if (!auth0Sub) {
      return fail(res, "Auth0 token does not contain a subject.", 401);
    }

    /*
     * STEP 2
     *
     * Get the Auth0 user profile.
     *
     * Access Tokens do not necessarily
     * contain email/name claims.
     */

    const profile = await getAuth0UserInfo(token);

    /*
     * Security check:
     *
     * The /userinfo subject must match
     * the verified JWT subject.
     */

    if (!profile?.sub || profile.sub !== auth0Sub) {
      return fail(res, "Auth0 identity verification failed.", 401);
    }

    /*
     * Get email.
     */

    const email = profile.email?.trim().toLowerCase();

    if (!email) {
      return fail(
        res,
        "Your Auth0 account did not provide an email address.",
        400,
      );
    }

    /*
     * Require verified email before
     * automatically linking accounts.
     */

    if (profile.email_verified !== true) {
      return fail(res, "Your Auth0 email address must be verified.", 403);
    }

    /*
     * STEP 3
     *
     * Find existing ShopSphere user
     * using Auth0 identity.
     */

    let user = await User.findOne({
      auth0Sub,
    }).select("+passwordHash");

    /*
     * STEP 4
     *
     * If this Auth0 identity is not
     * linked yet, check existing
     * ShopSphere account by email.
     */

    if (!user) {
      user = await User.findOne({
        email,
      }).select("+passwordHash");

      /*
       * Link Auth0 identity to the
       * existing ShopSphere account.
       */

      if (user) {
        user.auth0Sub = auth0Sub;

        await user.save();
      }
    }

    /*
     * STEP 5
     *
     * Create new ShopSphere user if
     * no account exists.
     */

    if (!user) {
      user = await User.create({
        name: profile.name || profile.nickname || email.split("@")[0],

        email,

        auth0Sub,

        role: "USER",

        status: "ACTIVE",
      });
    }

    /*
     * STEP 6
     *
     * Check ShopSphere account status.
     */

    if (user.status === "DISABLED") {
      return fail(res, "Account disabled.", 403);
    }

    /*
     * STEP 7
     *
     * Generate ShopSphere JWT.
     */

    const shopsphereToken = tokenFor(user);

    /*
     * STEP 8
     *
     * Return ONLY ShopSphere JWT
     * to the frontend for normal API use.
     */

    return ok(
      res,

      {
        user: publicUser(user),

        token: shopsphereToken,
      },

      "Login successful.",
    );
  } catch (error) {
    console.error("[AUTH0 LOGIN ERROR]", error.message);

    return fail(res, "Invalid or expired Auth0 token.", 401);
  }
}

/* =====================================================
   CURRENT USER
===================================================== */

async function me(req, res) {
  return ok(res, req.user);
}

/* =====================================================
   INTERNAL USER LOOKUP
===================================================== */

async function internalUser(req, res) {
  const user = await User.findById(req.params.id).lean();

  if (!user) {
    return fail(res, "User not found.", 404);
  }

  delete user.passwordHash;

  return ok(res, user);
}

/* =====================================================
   INTERNAL USER LIST
===================================================== */

async function internalUsers(req, res) {
  const users = await User.find()
    .select("-passwordHash")
    .sort({
      createdAt: -1,
    })
    .lean();

  return ok(res, users);
}

/* =====================================================
   INTERNAL USER UPDATE
===================================================== */

async function updateInternal(req, res) {
  const allowed = ["name", "phone", "status", "role"];

  const updates = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,

    updates,

    {
      new: true,

      runValidators: true,
    },
  ).lean();

  if (!user) {
    return fail(res, "User not found.", 404);
  }

  delete user.passwordHash;

  return ok(res, user);
}

module.exports = {
  register,

  registerVendor,

  login,

  auth0Login,

  me,

  internalUser,

  internalUsers,

  updateInternal,
};
