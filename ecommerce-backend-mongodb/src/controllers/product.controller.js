const Product = require("../models/Product");
const Review = require("../models/Review");
const Vendor = require("../models/Vendor");
const { ok, fail } = require("../utils/apiResponse");
const {
  pagination,
  buildProductFilter,
  productSort,
} = require("../utils/query");

async function list(req, res) {
  const { page, limit, skip } = pagination(req);
  const filter = buildProductFilter(req.query);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(productSort(req.query.sort))
      .skip(skip)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter),
  ]);

  const vendorIds = [
    ...new Set(
      items.map((product) => product.vendorId?.toString()).filter(Boolean),
    ),
  ];

  const vendors = await Vendor.find({
    userId: { $in: vendorIds },
  })
    .select("userId storeName email phone storeAddress status")
    .lean();

  const vendorMap = new Map(
    vendors.map((vendor) => [vendor.userId.toString(), vendor]),
  );

  const productsWithVendors = items.map((product) => ({
    ...product,
    vendor: vendorMap.get(product.vendorId?.toString()) || null,
  }));

  ok(res, {
    items: productsWithVendors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

async function getById(req, res) {
  const product = await Product.findById(req.params.id).lean();
  if (!product) return fail(res, "Product not found.", 404);

  const [vendor, reviews] = await Promise.all([
    Vendor.findOne({ userId: product.vendorId }).lean(),
    Review.find({ productId: product._id })
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  ok(res, { product, vendor, reviews });
}

async function create(req, res) {
  const product = await Product.create({
    ...req.body,
    vendorId: req.user._id,
  });
  ok(res, product, "Product created.", 201);
}

async function update(req, res) {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, vendorId: req.user._id },
    req.body,
    { new: true, runValidators: true },
  );
  if (!product) return fail(res, "Product not found or not owned by you.", 404);
  ok(res, product, "Product updated.");
}

async function remove(req, res) {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    vendorId: req.user._id,
  });
  if (!product) return fail(res, "Product not found or not owned by you.", 404);
  ok(res, null, "Product deleted.");
}

async function updateStock(req, res) {
  const quantity = Number(req.body.stock);
  if (!Number.isInteger(quantity) || quantity < 0)
    return fail(res, "Stock must be a non-negative integer.");

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, vendorId: req.user._id },
    { stock: quantity },
    { new: true, runValidators: true },
  );
  if (!product) return fail(res, "Product not found or not owned by you.", 404);
  ok(res, product, "Stock updated.");
}

module.exports = { list, getById, create, update, remove, updateStock };
