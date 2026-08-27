const CustomerIssue = require("../models/CustomerIssue");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const { ok, fail } = require("../utils/apiResponse");

async function create(req, res) {
  if (req.body.orderId) {
    const order = await Order.findOne({ _id: req.body.orderId, userId: req.user._id });
    if (!order) return fail(res, "Order does not belong to you.", 403);
  }

  const issue = await CustomerIssue.create({
    ...req.body,
    userId: req.user._id
  });
  ok(res, issue, "Issue submitted.", 201);
}

async function list(req, res) {
  let filter = {};

  if (req.user.role === "USER") {
    filter.userId = req.user._id;
  } else if (req.user.role === "VENDOR") {
    const vendorOrders = await OrderItem.find({ vendorId: req.user._id }).distinct("orderId");
    filter = {
      $or: [
        { assignedTo: req.user._id },
        { orderId: { $in: vendorOrders } }
      ]
    };
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

  ok(res, await CustomerIssue.find(filter)
    .populate("userId", "name email")
    .populate("assignedTo", "name email role")
    .sort({ createdAt: -1 }));
}

async function getById(req, res) {
  const issue = await CustomerIssue.findById(req.params.id)
    .populate("userId", "name email")
    .populate("assignedTo", "name email role");

  if (!issue) return fail(res, "Issue not found.", 404);

  if (req.user.role === "USER" && issue.userId._id.toString() !== req.user._id.toString()) {
    return fail(res, "Issue not found.", 404);
  }

  if (req.user.role === "VENDOR") {
    const related = issue.orderId
      ? await OrderItem.exists({ orderId: issue.orderId, vendorId: req.user._id })
      : issue.assignedTo?._id?.toString() === req.user._id.toString();
    if (!related) return fail(res, "Issue not found.", 404);
  }

  ok(res, issue);
}

async function update(req, res) {
  const issue = await CustomerIssue.findById(req.params.id);
  if (!issue) return fail(res, "Issue not found.", 404);

  if (req.user.role === "USER" && issue.userId.toString() !== req.user._id.toString()) {
    return fail(res, "Issue not found.", 404);
  }

  if (req.user.role === "VENDOR") {
    const related = issue.orderId && await OrderItem.exists({ orderId: issue.orderId, vendorId: req.user._id });
    if (!related && issue.assignedTo?.toString() !== req.user._id.toString()) {
      return fail(res, "You cannot modify this issue.", 403);
    }
    const allowed = ["status", "response"];
    Object.keys(req.body).forEach(k => {
      if (allowed.includes(k)) issue[k] = req.body[k];
    });
  } else {
    Object.assign(issue, req.body);
  }

  if (issue.status === "RESOLVED" || issue.status === "CLOSED") {
    issue.resolvedAt = issue.resolvedAt || new Date();
  } else {
    issue.resolvedAt = undefined;
  }

  await issue.save();
  ok(res, issue, "Issue updated.");
}

module.exports = { create, list, getById, update };
