function pagination(req) {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit || "9", 10), 1),
    100,
  );
  return { page, limit, skip: (page - 1) * limit };
}
function buildProductFilter(q) {
  const f = {};
  if (q.q) {
    const e = q.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    f.$or = [
      { name: { $regex: e, $options: "i" } },
      { brand: { $regex: e, $options: "i" } },
      { description: { $regex: e, $options: "i" } },
    ];
  }
  if (q.brand) f.brand = q.brand;
  if (q.category) f.category = q.category;
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    f.price = {};
    if (q.minPrice !== undefined) f.price.$gte = Number(q.minPrice);
    if (q.maxPrice !== undefined) f.price.$lte = Number(q.maxPrice);
  }
  if (q.rating) f.rating = { $gte: Number(q.rating) };
  if (q.stock === "in") f.stock = { $gt: 0 };
  if (q.stock === "out") f.stock = 0;
  if (q.vendorId) f.vendorId = q.vendorId;
  return f;
}
function productSort(v) {
  if (v === "low") return { price: 1 };
  if (v === "high") return { price: -1 };
  if (v === "rating") return { rating: -1 };
  return { createdAt: -1 };
}

function buildProductCacheKey(query) {
  const normalized = {};

  Object.keys(query)
    .sort()
    .forEach((key) => {
      normalized[key] = query[key];
    });

  return `products:list:${JSON.stringify(normalized)}`;
}

module.exports = {
  pagination,
  buildProductFilter,
  productSort,
  buildProductCacheKey,
};
