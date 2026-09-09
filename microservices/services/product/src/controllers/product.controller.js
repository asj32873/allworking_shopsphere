const Product = require("../models/Product");
const { ok, fail } = require("../utils/apiResponse");

const {
  pagination,
  buildProductFilter,
  productSort,
  buildProductCacheKey,
} = require("../services/query.service");

const { ingestProduct, deleteProduct } = require("../services/rag.service");
const cache = require("../services/cache.service");
const {
  getVendorByUserId,
  getAllVendors,
} = require("../services/vendor.service");

async function list(req, res) {
  const cacheKey = buildProductCacheKey(req.query);

  const cached = await cache.get(cacheKey);

  if (cached) {
    return ok(res, cached);
  }

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

  const vendors = await getAllVendors();

  const vendorMap = new Map(
    vendors.map((vendor) => [String(vendor.userId), vendor]),
  );

  const productsWithVendor = items.map((product) => ({
    ...product,
    vendor: vendorMap.get(String(product.vendorId)) || null,
  }));

  const result = {
    items: productsWithVendor,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  await cache.set(cacheKey, result);

  return ok(res, result);
}

async function invalidateProductCache(productId) {
  await Promise.all([
    cache.del(`product:${productId}`),
    cache.delByPattern("products:list:*"),
  ]);
}

async function getById(req, res) {
  const productId = req.params.id;

  const cacheKey = `product:${productId}`;

  const cached = await cache.get(cacheKey);

  if (cached) {
    return ok(res, cached, "OK");
  }

  const product = await Product.findById(productId).lean();

  if (!product) {
    return fail(res, "Product not found.", 404);
  }

  const vendor = await getVendorByUserId(product.vendorId);

  const result = {
    ...product,
    vendor,
  };

  await cache.set(cacheKey, result);

  return ok(res, result);
}

async function create(req, res) {
  const product = await Product.create({
    ...req.body,
    vendorId: req.user._id,
  });

  await ingestProduct(product._id);
  await cache.delByPattern("products:list:*");

  return ok(res, product, "Product created.", 201);
}

async function update(req, res) {
  const product = await Product.findOneAndUpdate(
    {
      _id: req.params.id,
      vendorId: req.user._id,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!product) {
    return fail(res, "Product not found or not owned by you.", 404);
  }

  await ingestProduct(product._id);
  await Promise.all([
    cache.del(`product:${product._id}`),
    cache.delByPattern("products:list:*"),
  ]);

  return ok(res, product, "Product updated.");
}

async function remove(req, res) {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    vendorId: req.user._id,
  });

  if (!product) {
    return fail(res, "Product not found or not owned by you.", 404);
  }

  await deleteProduct(product._id);
  await Promise.all([
    cache.del(`product:${product._id}`),
    cache.delByPattern("products:list:*"),
  ]);

  return ok(res, null, "Product deleted.");
}

async function updateStock(req, res) {
  const stock = Number(req.body.stock);

  if (!Number.isInteger(stock) || stock < 0) {
    return fail(res, "Stock must be a non-negative integer.");
  }

  const product = await Product.findOneAndUpdate(
    {
      _id: req.params.id,
      vendorId: req.user._id,
    },
    {
      stock,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!product) {
    return fail(res, "Product not found or not owned by you.", 404);
  }

  await ingestProduct(product._id);

  await Promise.all([
    cache.del(`product:${product._id}`),
    cache.delByPattern("products:list:*"),
  ]);

  return ok(res, product, "Stock updated.");
}

async function internalGet(req, res) {
  const product = await Product.findById(req.params.id).lean();

  if (!product) {
    return fail(res, "Product not found.", 404);
  }

  return ok(res, product);
}

async function internalList(req, res) {
  const products = await Product.find().select("_id").lean();

  return ok(res, products);
}

async function internalReserve(req, res) {
  const { items } = req.body;

  if (!Array.isArray(items) || !items.length) {
    return fail(res, "items are required.");
  }

  const session = await Product.startSession();

  try {
    const result = [];

    await session.withTransaction(async () => {
      for (const item of items) {
        const product = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: {
              $gte: item.quantity,
            },
          },
          {
            $inc: {
              stock: -item.quantity,
            },
          },
          {
            new: true,
            session,
          },
        );

        if (!product) {
          const error = new Error(
            `Insufficient stock for product ${item.productId}`,
          );

          error.status = 409;
          throw error;
        }

        result.push(product);
      }
    });

    // Sync updated stock to RAG
    for (const product of result) {
      await ingestProduct(product._id);

      await cache.del(`product:${product._id}`);
    }

    await cache.delByPattern("products:list:*");

    return ok(res, result, "Stock reserved.");
  } finally {
    await session.endSession();
  }
}

async function internalRelease(req, res) {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return fail(res, "items are required.");
  }

  await Product.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: {
          _id: item.productId,
        },
        update: {
          $inc: {
            stock: item.quantity,
          },
        },
      },
    })),
  );
  const productIds = items.map((item) => item.productId);

  await Promise.all(productIds.map((id) => cache.del(`product:${id}`)));

  await cache.delByPattern("products:list:*");
  // Sync all changed products to RAG
  await ingestProduct(product._id);

  await Promise.all([
    cache.del(`product:${product._id}`),
    cache.delByPattern("products:list:*"),
  ]);

  return ok(res, null, "Stock released.");
}

async function internalRating(req, res) {
  const { rating, reviewCount } = req.body;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      rating: Number(rating) || 0,
      reviewCount: Number(reviewCount) || 0,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!product) {
    return fail(res, "Product not found.", 404);
  }
  await ingestProduct(product._id);

  return ok(res, product);
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  updateStock,
  internalGet,
  internalList,
  internalReserve,
  internalRelease,
  internalRating,
};
