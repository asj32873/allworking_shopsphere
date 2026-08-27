const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Product = require("../models/Product");
const Order = require("../models/Order");
const CustomerIssue = require("../models/CustomerIssue");
const { ok, fail } = require("../utils/apiResponse");

async function dashboard(req, res) {
  const [users, vendors, products, orders, openIssues, pendingVendors] = await Promise.all([
    User.countDocuments(),
    Vendor.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    CustomerIssue.countDocuments({ status: { $nin: ["RESOLVED", "CLOSED"] } }),
    Vendor.countDocuments({ status: "APPLIED" })
  ]);

  ok(res, { users, vendors, products, orders, openIssues, pendingVendors });
}

async function vendors(req, res) {
  ok(res, await Vendor.find().populate("userId", "name email phone status").sort({ createdAt: -1 }));
}

async function approveVendor(req, res) {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return fail(res, "Vendor not found.", 404);

  vendor.status = "VERIFIED";
  vendor.verifiedAt = new Date();
  await vendor.save();
  ok(res, vendor, "Vendor approved.");
}

async function rejectVendor(req, res) {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return fail(res, "Vendor not found.", 404);

  vendor.status = "REJECTED";
  vendor.verifiedAt = null;
  await vendor.save();
  ok(res, vendor, "Vendor rejected.");
}

async function deleteVendor(req, res) {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return fail(res, "Vendor not found.", 404);

  await Vendor.findByIdAndDelete(vendor._id);
  await User.findByIdAndUpdate(vendor.userId, { status: "DISABLED" });
  ok(res, null, "Vendor deleted.");
}

async function users(req, res) {
  ok(res, await User.find().select("-passwordHash").sort({ createdAt: -1 }));
}

async function updateUserStatus(req, res) {
  if (req.params.id === req.user._id.toString()) return fail(res, "You cannot disable your own admin account.", 400);
  const status = req.body.status;
  if (!["ACTIVE", "DISABLED"].includes(status)) return fail(res, "Invalid user status.");

  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select("-passwordHash");
  if (!user) return fail(res, "User not found.", 404);
  ok(res, user, "User status updated.");
}

async function issues(req, res) {
  ok(res, await CustomerIssue.find()
    .populate("userId", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 }));
}

module.exports = {
  dashboard, vendors, approveVendor, rejectVendor, deleteVendor,
  users, updateUserStatus, issues
};
