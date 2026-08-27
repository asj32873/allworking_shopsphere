const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  storeName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: String,
  storeAddress: { type: String, required: true },
  status: { type: String, enum: ["APPLIED", "VERIFIED", "REJECTED", "UNVERIFIED"], default: "APPLIED", index: true },
  verifiedAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Vendor", schema);
