const crypto = require("crypto");

function requestId(req, res, next) {
  const incomingRequestId = req.get("x-request-id");

  const isValidRequestId =
    typeof incomingRequestId === "string" &&
    incomingRequestId.length > 0 &&
    incomingRequestId.length <= 100;

  req.requestId = isValidRequestId
    ? incomingRequestId
    : crypto.randomUUID();

  res.setHeader("x-request-id", req.requestId);

  next();
}

module.exports = requestId;
