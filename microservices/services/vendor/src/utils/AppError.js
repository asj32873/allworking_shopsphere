class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);

    this.name = "AppError";

    this.statusCode = statusCode;

    this.code =
      options.code ||
      (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST");

    this.details = options.details;

    this.isOperational = options.isOperational !== false;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new AppError(message, 400, {
      code: "BAD_REQUEST",
      details,
    });
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401, {
      code: "UNAUTHORIZED",
    });
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, 403, {
      code: "FORBIDDEN",
    });
  }

  static notFound(message = "Resource not found") {
    return new AppError(message, 404, {
      code: "NOT_FOUND",
    });
  }

  static conflict(message, details) {
    return new AppError(message, 409, {
      code: "CONFLICT",
      details,
    });
  }

  static serviceUnavailable(message = "Service temporarily unavailable") {
    return new AppError(message, 503, {
      code: "SERVICE_UNAVAILABLE",
    });
  }
}

module.exports = AppError;
