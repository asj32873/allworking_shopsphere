const jwt = require("jsonwebtoken");

const { getJson } = require("../utils/serviceClient");

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = header.slice(7);

    /*
     * ONLY accept ShopSphere-issued JWTs.
     *
     * Auth0 tokens should NEVER reach
     * normal microservices.
     */

    const identity = jwt.verify(
      token,

      process.env.JWT_SECRET,

      {
        algorithms: ["HS256"],
      },
    );

    if (!identity.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    /*
     * Get current user from Auth Service
     */

    const authService = process.env.AUTH_SERVICE_URL || "http://localhost:5002";

    const result = await getJson(
      authService,

      `/internal/users/${encodeURIComponent(identity.id)}`,
    );

    if (!result.ok || !result.data?.data) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    const user = result.data.data;

    if (user.status === "DISABLED") {
      return res.status(403).json({
        success: false,
        message: "Account disabled.",
      });
    }

    req.user = user;

    req.auth = {
      ...identity,

      id: String(identity.id),
    };

    next();
  } catch (error) {
    console.error("[AUTH ERROR]", error.message);

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
