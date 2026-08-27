const { Document } = require("@langchain/core/documents");

require("../models/User");

const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const Review = require("../models/Review");

const { getVectorStore } = require("./vectorStore");

/**
 * Build a single RAG document for one product.
 *
 * This includes:
 * - Product information
 * - Vendor information
 * - Current reviews
 */
async function buildProductDocument(productId) {
  const product = await Product.findById(productId).lean();

  if (!product) {
    throw new Error(`Product ${productId} not found.`);
  }

  const vendor = await Vendor.findOne({
    userId: product.vendorId,
  }).lean();

  const reviews = await Review.find({
    productId: product._id,
  })
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .lean();

  const reviewText = reviews.length
    ? reviews
        .map((r) => `Rating: ${r.rating}/5\nReview: ${r.review}`)
        .join("\n\n")
    : "No reviews available.";

  const content = `
Product Name: ${product.name}
Brand: ${product.brand}
Category: ${product.category}
Price: ₹${product.price}
Stock: ${product.stock}
Rating: ${product.rating || 0}/5
Review Count: ${product.reviewCount || 0}

Description:
${product.description}

Vendor:
${vendor?.storeName || "Unknown vendor"}

Customer Reviews:
${reviewText}
`;

  return new Document({
    pageContent: content,
    metadata: {
      productId: product._id.toString(),
      type: "product",
      name: product.name,
      brand: product.brand,
      category: product.category,
    },
  });
}

/**
 * Stable Chroma ID for a product.
 *
 * Every product gets exactly one vector.
 */
function productDocumentId(productId) {
  return `product-${productId.toString()}`;
}

/**
 * Re-index ONE product.
 *
 * This is the important function used after
 * reviews are created/updated/deleted.
 */
async function ingestProduct(productId) {
  const vectorStore = await getVectorStore();

  const document = await buildProductDocument(productId);

  const id = productDocumentId(productId);

  // Remove the previous version of this product.
  try {
    await vectorStore.delete({
      ids: [id],
    });
  } catch (error) {
    console.log("No existing Chroma document to delete:", error.message);
  }

  // Add the fresh version.
  await vectorStore.addDocuments([document], {
    ids: [id],
  });

  console.log(`Re-indexed product ${productId} in Chroma`);

  return document;
}

/**
 * Re-index ALL products.
 *
 * Used during server startup / initial ingestion.
 */
async function ingestProducts() {
  const products = await Product.find().select("_id").lean();

  console.log(`Starting RAG ingestion for ${products.length} products...`);

  for (const product of products) {
    try {
      await ingestProduct(product._id);
    } catch (error) {
      console.error(`Failed to ingest product ${product._id}:`, error);
    }
  }

  console.log(`Indexed ${products.length} ShopSphere products`);
}

module.exports = {
  buildProductDocument,
  ingestProduct,
  ingestProducts,
  productDocumentId,
};
