function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      console.log("VALIDATION FAILED");
      console.log("Received body:", req[source]);
      console.log("Validation errors:", result.error.issues);

      return res.status(400).json({
        success: false,
        message: "Invalid request.",
        details: result.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      });
    }

    req[source] = result.data;
    next();
  };
}

module.exports = validate;
