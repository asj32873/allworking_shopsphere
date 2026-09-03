const { Document } = require("@langchain/core/documents");
const { getVectorStore } = require("./vectorStore");
const { getJson } = require("../utils/serviceClient");

const PRODUCT = () =>
  process.env.PRODUCT_SERVICE_URL || "http://localhost:5003";

const REVIEWS = () => process.env.REVIEW_SERVICE_URL || "http://localhost:5009";

function id(p) {
  return `product-${p._id || p.id}`;
}

async function buildProductDocument(productId) {
  const p = await getJson(PRODUCT(), `/internal/products/${productId}`);

  if (!p.ok) throw new Error("Product not found");

  const product = p.data.data;

  const r = await getJson(REVIEWS(), `/api/reviews/product/${productId}`);

  const reviews = r.data?.data || [];

  const text = `Product Name: ${product.name}
Brand: ${product.brand}
Category: ${product.category}
Price: ₹${product.price}
Stock: ${product.stock}
Rating: ${product.rating || 0}/5
Review Count: ${product.reviewCount || 0}

Description:
${product.description}

Customer Reviews:
${
  reviews.length
    ? reviews
        .map(
          (x) => `Rating: ${x.rating}/5
Review: ${x.review}`,
        )
        .join("\n\n")
    : "No reviews available."
}`;

  return new Document({
    pageContent: text,
    metadata: {
      productId: String(product._id || product.id),
      type: "product",
      name: product.name,
      brand: product.brand,
      category: product.category,
    },
  });
}

async function ingestProduct(productId) {
  const vectorStore = await getVectorStore();
  const document = await buildProductDocument(productId);
  const docId = id(document.metadata);

  try {
    await vectorStore.delete({
      ids: [docId],
    });
  } catch (error) {
    // Document may not exist yet
  }

  await vectorStore.addDocuments([document], { ids: [docId] });

  return document;
}

async function deleteProductFromVectorStore(productId) {
  const vectorStore = await getVectorStore();

  try {
    await vectorStore.delete({
      ids: [`product-${productId}`],
    });
  } catch (error) {
    console.error(
      `Failed to delete product ${productId} from vector store:`,
      error.message,
    );
  }
}

async function ingestAllProducts() {
  console.log("Starting product ingestion...");

  const response = await getJson(PRODUCT(), "/internal/products");

  if (!response.ok) {
    throw new Error(response.data?.message || "Failed to fetch products");
  }

  const products = response.data?.data || [];

  console.log(`Found ${products.length} products to ingest.`);

  for (const product of products) {
    const productId = product._id || product.id;

    try {
      await ingestProduct(productId);
      console.log(`✓ Ingested product: ${productId}`);
    } catch (error) {
      console.error(`✗ Failed to ingest product ${productId}:`, error.message);
    }
  }

  console.log("Product ingestion completed.");
}

module.exports = {
  buildProductDocument,
  ingestProduct,
  ingestAllProducts,
  deleteProductFromVectorStore,
};
