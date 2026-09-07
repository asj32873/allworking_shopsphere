const AppError = require("../utils/AppError");

module.exports =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(
        new AppError("Invalid request.", 400, {
          code: "VALIDATION_ERROR",
          details: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        }),
      );
    }

    req[source] = result.data;

    next();
  };
