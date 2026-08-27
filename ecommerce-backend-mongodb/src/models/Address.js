const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["Home", "Office", "Other"], default: "Home" },
  addressLine: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true }
}, { timestamps: true });

schema.index({ userId: 1, isDefault: 1 });

schema.add({
  isDefault: { type: Boolean, default: false }
});

module.exports = mongoose.model("Address", schema);
