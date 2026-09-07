const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const routes = require("./routes");
const {
  notFound,
  errorHandler,
} = require("../../../packages/common/middleware/error");

const app = express();
const requestId = require("../../../packages/common/middleware/requestId");
app.use(requestId);
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-internal-service-token",
      "x-request-id",
    ],
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) =>
  res.json({
    success: true,
    service: "shopsphere-cart",
    timestamp: new Date().toISOString(),
  }),
);

/*
|--------------------------------------------------------------------------
| TEMPORARY SERVICE CLIENT TEST ENDPOINTS
|--------------------------------------------------------------------------
| Remove these endpoints after testing.
*/

/*
|--------------------------------------------------------------------------
| 1. Timeout test
|--------------------------------------------------------------------------
*/

app.get("/test/slow", async (req, res) => {
  console.log("[TEST] Slow request started");

  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log("[TEST] Slow request finished");

  res.json({
    success: true,
    message: "Slow response",
  });
});

/*
|--------------------------------------------------------------------------
| 2. Retry test
|--------------------------------------------------------------------------
*/

let retryAttempts = 0;

app.get("/test/retry", (req, res) => {
  retryAttempts += 1;

  console.log(`[TEST] Retry request number: ${retryAttempts}`);

  if (retryAttempts < 3) {
    return res.status(503).json({
      success: false,
      message: "Temporary failure",
      attempt: retryAttempts,
    });
  }

  res.json({
    success: true,
    message: "Success after retry",
    attempt: retryAttempts,
  });
});

/*                                                                         |
| -------------------------------------------------------------------------- |
| 3. POST retrySafe test                                                     |
| -------------------------------------------------------------------------- |
| */

let postRetryAttempts = 0;

app.post("/test/post-retry", (req, res) => {
  postRetryAttempts += 1;

  console.log(`[TEST] POST retry request number: ${postRetryAttempts}`);

  // Fail the first 2 requests
  if (postRetryAttempts < 3) {
    return res.status(503).json({
      success: false,
      message: "Temporary POST failure",
      attempt: postRetryAttempts,
    });
  }

  // Succeed on the third request
  return res.status(200).json({
    success: true,
    message: "POST succeeded after retry",
    attempt: postRetryAttempts,
    received: req.body,
  });
});

/*                                                                         |
| -------------------------------------------------------------------------- |
| Reset POST retry counter                                                   |
| -------------------------------------------------------------------------- |
| */

app.post("/test/post-retry/reset", (req, res) => {
  postRetryAttempts = 0;

  res.json({
    success: true,
    message: "POST retry counter reset",
  });
});

/*
|--------------------------------------------------------------------------
| Reset retry counter
|--------------------------------------------------------------------------
*/

app.post("/test/retry/reset", (req, res) => {
  retryAttempts = 0;

  res.json({
    success: true,
    message: "Retry counter reset",
  });
});

/*
|--------------------------------------------------------------------------
| Application routes
|--------------------------------------------------------------------------
*/

app.use("/", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
