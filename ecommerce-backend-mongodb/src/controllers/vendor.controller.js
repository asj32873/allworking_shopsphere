const Vendor = require("../models/Vendor");
const Product = require("../models/Product");
const OrderItem = require("../models/OrderItem");
const Order = require("../models/Order");
const CustomerIssue = require("../models/CustomerIssue");
const { ok, fail } = require("../utils/apiResponse");

async function profile(req, res) {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) return fail(res, "Vendor profile not found.", 404);
  ok(res, vendor);
}

async function dashboard(req, res) {
  const [productCount, products, itemCount, issues] = await Promise.all([
    Product.countDocuments({ vendorId: req.user._id }),
    Product.find({ vendorId: req.user._id }).select("stock"),
    OrderItem.countDocuments({ vendorId: req.user._id }),
    CustomerIssue.countDocuments({
      $or: [
        { assignedTo: req.user._id },
        { orderId: { $in: await OrderItem.find({ vendorId: req.user._id }).distinct("orderId") } }
      ],
      status: { $nin: ["RESOLVED", "CLOSED"] }
    })
  ]);

  const orderIds = await OrderItem.find({ vendorId: req.user._id }).distinct("orderId");
  const orderDocs = await Order.find({ _id: { $in: orderIds } }).lean();
  const items = await OrderItem.find({ vendorId: req.user._id }).lean();

  const sales = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  ok(res, {
    products: productCount,
    orders: orderDocs.length,
    lowStock: products.filter(p => p.stock < 10).length,
    openIssues: issues,
    sales
  });
}

module.exports = { profile, dashboard };
