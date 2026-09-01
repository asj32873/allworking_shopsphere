const Vendor = require("../models/Vendor");
const { getJson } = require("../utils/serviceClient");
const { ok, fail } = require("../utils/apiResponse");
const PRODUCT = () =>
  process.env.PRODUCT_SERVICE_URL || "http://localhost:5003";
const ORDER = () => process.env.ORDER_SERVICE_URL || "http://localhost:5005";
async function profile(req, res) {
  const userId = req.auth?.id;

  if (!userId) {
    return fail(res, "Authenticated user ID not found.", 401);
  }

  const v = await Vendor.findOne({ userId }).lean();

  if (!v) {
    return fail(res, "Vendor profile not found.", 404);
  }

  return ok(res, v);
}
async function dashboard(req, res) {
  const userId = req.auth?.id;

  const pr = await getJson(
    PRODUCT(),
    `/api/products?vendorId=${encodeURIComponent(userId)}&limit=100`,
  );

  const or = await getJson(ORDER(), `/internal/orders/vendor/${userId}/items`);

  const ir = await getJson(
    process.env.SUPPORT_SERVICE_URL || "http://localhost:5011",
    `/internal/issues/vendor/${userId}/count`,
  );

  const products = pr.data?.data?.items || [];
  const items = or.data?.data || [];

  const orderIds = [...new Set(items.map((i) => String(i.orderId)))];

  const sales = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  return ok(res, {
    products: products.length,
    orders: orderIds.length,
    lowStock: products.filter((p) => p.stock < 10).length,
    openIssues: ir.data?.data?.count || 0,
    sales,
  });
}
async function internalCreate(req, res) {
  const v = await Vendor.create(req.body);
  ok(res, v, "Vendor created.", 201);
}
async function internalGetByUser(req, res) {
  const v = await Vendor.findOne({ userId: req.params.userId }).lean();
  if (!v) return fail(res, "Vendor not found.", 404);
  ok(res, v);
}
async function internalList(req, res) {
  ok(res, await Vendor.find().sort({ createdAt: -1 }).lean());
}
async function internalUpdate(req, res) {
  const v = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!v) return fail(res, "Vendor not found.", 404);
  ok(res, v);
}
async function internalRemove(req, res) {
  const v = await Vendor.findByIdAndDelete(req.params.id);
  if (!v) return fail(res, "Vendor not found.", 404);
  ok(res, v);
}
module.exports = {
  profile,
  dashboard,
  internalCreate,
  internalGetByUser,
  internalList,
  internalUpdate,
  internalRemove,
};
