const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const path = require("path");

console.log("ROUTES RESOLVE TO:", require.resolve("./routes"));

const routes = require("./routes");
const paymentController = require("./controllers/payment.controller");

const { notFound, errorHandler } = require("./middleware/error");

const app = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentController.stripeWebhook,
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "shopsphere-api",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api", routes);

app.post("/api/payment-debug", (req, res) => {
  console.log("🔥 PAYMENT DEBUG ROUTE HIT");
  res.json({
    success: true,
    message: "app.js payment debug route works",
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
