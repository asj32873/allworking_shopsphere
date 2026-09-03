const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    passwordHash: {
      type: String,
      select: false,
    },

    /*
     * Auth0 identity.
     *
     * Examples:
     *
     * google-oauth2|123456789
     * auth0|abc123
     * github|123456
     */
    auth0Sub: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["USER", "VENDOR", "ADMIN"],
      default: "USER",
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "DISABLED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", schema);
