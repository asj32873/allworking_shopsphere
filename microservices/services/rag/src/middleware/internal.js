const AppError = require("../../../../packages/common/utils/AppError");

module.exports = (req, res, next) => {
  const expected = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expected || req.headers["x-internal-service-token"] !== expected) {
    return next(
      new AppError("Invalid internal service credentials.", 401, {
        code: "INVALID_INTERNAL_CREDENTIALS",
      }),
    );
  }

  next();
};
