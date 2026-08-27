function pagination(req) {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "9", 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function buildProductFilter(query) {
  const filter = {};

  if (query.q) {
    const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { brand: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } }
    ];
  }

  if (query.brand) filter.brand = query.brand;
  if (query.category) filter.category = query.category;

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice !== undefined) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.rating) filter.rating = { $gte: Number(query.rating) };
  if (query.stock === "in") filter.stock = { $gt: 0 };
  if (query.stock === "out") filter.stock = 0;
  if (query.vendorId) filter.vendorId = query.vendorId;

  return filter;
}

function productSort(value) {
  if (value === "low") return { price: 1 };
  if (value === "high") return { price: -1 };
  if (value === "rating") return { rating: -1 };
  if (value === "newest") return { createdAt: -1 };
  return { createdAt: -1 };
}

module.exports = { pagination, buildProductFilter, productSort };
