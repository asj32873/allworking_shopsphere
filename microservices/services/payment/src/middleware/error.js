const AppError = require("@shopsphere/common");

function handleCastError(error) {
  return new AppError(`Invalid value for ${error.path}`, 400, {
    code: "INVALID_RESOURCE_ID",
  });
}

function handleDuplicateKeyError(error) {
  const fields = Object.keys(error.keyValue || {});
  const field = fields[0] || "field";

  return new AppError(`${field} already exists`, 409, {
    code: "DUPLICATE_RESOURCE",
    details: error.keyValue,
  });
}

function handleValidationError(error) {
  const details = Object.values(error.errors || {}).map((item) => ({
    field: item.path,
    message: item.message,
  }));

  return new AppError("Validation failed", 400, {
    code: "VALIDATION_ERROR",
    details,
  });
}

function handleJwtError() {
  return new AppError("Invalid authentication token", 401, {
    code: "INVALID_TOKEN",
  });
}

function handleJwtExpiredError() {
  return new AppError("Authentication token has expired", 401, {
    code: "TOKEN_EXPIRED",
  });
}

function handleZodError(error) {
  const details = error.issues?.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

  return new AppError("Validation failed", 400, {
    code: "VALIDATION_ERROR",
    details,
  });
}

function notFound(req, res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

function errorHandler(error, req, res, next) {
  /*
   * If Express already started sending the response,
   * delegate to Express's default handler.
   */
  if (res.headersSent) {
    return next(error);
  }

  let err = error;

  // MongoDB / Mongoose

  if (err.name === "CastError") {
    err = handleCastError(err);
  }

  if (err.code === 11000) {
    err = handleDuplicateKeyError(err);
  }

  if (err.name === "ValidationError") {
    err = handleValidationError(err);
  }

  // JWT

  if (err.name === "JsonWebTokenError") {
    err = handleJwtError();
  }

  if (err.name === "TokenExpiredError") {
    err = handleJwtExpiredError();
  }

  // Zod

  if (err.name === "ZodError") {
    err = handleZodError(err);
  }

  // Unknown errors

  if (!(err instanceof AppError)) {
    err = new AppError("Internal server error", 500, {
      code: "INTERNAL_SERVER_ERROR",
      isOperational: false,
    });
  }

  // Logging

  console.error(
    JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),

      requestId: req.requestId || null,

      method: req.method,
      path: req.originalUrl,

      statusCode: err.statusCode,
      code: err.code,

      message: error.message,

      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    }),
  );

  const isProduction = process.env.NODE_ENV === "production";

  const response = {
    success: false,

    message:
      isProduction && err.statusCode >= 500 && !err.isOperational
        ? "Internal server error"
        : err.message,

    code: err.code,

    requestId: req.requestId,
  };

  if (err.details) {
    response.details = err.details;
  }

  if (!isProduction && error.stack) {
    response.stack = error.stack;
  }

  res.status(err.statusCode).json(response);
}

module.exports = {
  notFound,
  errorHandler,
};
