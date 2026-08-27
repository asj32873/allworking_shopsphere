const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const User = require("../models/User");
const Vendor = require("../models/Vendor");

const auth0Domain = (process.env.AUTH0_DOMAIN || "")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

const auth0Audience = process.env.AUTH0_AUDIENCE;
const auth0Issuer = auth0Domain ? `https://${auth0Domain}/` : null;

const jwks = auth0Domain
  ? jwksClient({
      jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    })
  : null;

function getSigningKey(header, callback) {
  if (!jwks) {
    return callback(new Error("Auth0 is not configured."));
  }

  if (!header?.kid) {
    return callback(new Error("Token is missing kid."));
  }

  jwks
    .getSigningKey(header.kid)
    .then((key) => callback(null, key.getPublicKey()))
    .catch(callback);
}

function verifyAuth0Token(token) {
  if (!auth0Domain || !auth0Audience || !auth0Issuer || !jwks) {
    return Promise.reject(new Error("Auth0 is not configured."));
  }

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        algorithms: ["RS256"],
        audience: auth0Audience,
        issuer: auth0Issuer,
      },
      (error, payload) => {
        if (error) {
          return reject(error);
        }

        resolve(payload);
      },
    );
  });
}

function userNameFromAuth0(profile) {
  return (
    profile.name ||
    profile.nickname ||
    profile.email?.split("@")[0] ||
    "ShopSphere User"
  ).trim();
}

async function getOrCreateAuth0User(payload, accessToken) {
  let profile = payload;

  /*
   * Auth0 access tokens issued for an API do not necessarily contain
   * email/name. Because the frontend requests the email scope, use
   * Auth0's /userinfo endpoint when those values are missing.
   */
  if (!profile.email || !profile.name) {
    const response = await fetch(`https://${auth0Domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = new Error("Unable to load your Auth0 profile.");
      error.status = 401;
      throw error;
    }

    const userInfo = await response.json();

    profile = {
      ...payload,
      ...userInfo,
    };
  }

  const auth0Sub = profile.sub;
  const email = profile.email?.trim().toLowerCase();

  if (!auth0Sub) {
    const error = new Error("Auth0 token does not contain a subject.");
    error.status = 401;
    throw error;
  }

  if (!email) {
    const error = new Error(
      "Your Auth0 account did not provide an email address.",
    );

    error.status = 400;
    throw error;
  }

  /*
   * Prevent accidental account linking with an unverified Auth0 email.
   */
  if (profile.email_verified === false) {
    const error = new Error(
      "Please verify your Auth0 email address before signing in.",
    );

    error.status = 403;
    throw error;
  }

  let user = await User.findOne({ auth0Sub }).select("-passwordHash");

  /*
   * Existing ShopSphere account:
   *
   * If the email already exists, attach the Auth0 subject to that
   * existing MongoDB user.
   */
  if (!user) {
    user = await User.findOne({ email }).select("-passwordHash");

    if (user) {
      user.auth0Sub = auth0Sub;

      if (!user.name && profile.name) {
        user.name = userNameFromAuth0(profile);
      }

      await user.save();
    } else {
      /*
       * Brand-new Auth0 user.
       *
       * New Auth0 accounts start as USER.
       */
      user = await User.create({
        name: userNameFromAuth0(profile),
        email,
        auth0Sub,
        role: "USER",
        status: "ACTIVE",
      });
    }
  }

  if (user.status === "DISABLED") {
    const error = new Error("Account disabled.");
    error.status = 403;
    throw error;
  }

  /*
   * Preserve the existing vendor approval system.
   */
  if (user.role === "VENDOR") {
    const vendor = await Vendor.findOne({
      userId: user._id,
    });

    if (!vendor || vendor.status !== "VERIFIED") {
      const error = new Error("Vendor is not verified yet.");
      error.status = 403;
      throw error;
    }
  }

  return user;
}

async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";

  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  /*
   * ---------------------------------------------------------
   * AUTH0 AUTHENTICATION
   * ---------------------------------------------------------
   */
  if (auth0Domain && auth0Audience) {
    try {
      const payload = await verifyAuth0Token(token);

      req.user = await getOrCreateAuth0User(payload, token);

      return next();
    } catch (error) {
      /*
       * If Auth0 verification fails, continue to the old
       * ShopSphere JWT authentication below.
       *
       * This allows your existing email/password accounts
       * to continue working.
       */
      if (error.status === 400 || error.status === 403) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * LEGACY SHOPSPHERE JWT AUTHENTICATION
   * ---------------------------------------------------------
   */
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    if (user.status === "DISABLED") {
      return res.status(403).json({
        success: false,
        message: "Account disabled.",
      });
    }

    if (user.role === "VENDOR") {
      const vendor = await Vendor.findOne({
        userId: user._id,
      });

      if (!vendor || vendor.status !== "VERIFIED") {
        return res.status(403).json({
          success: false,
          message: "Vendor is not verified yet.",
        });
      }
    }

    req.user = user;

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission for this resource.",
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};
