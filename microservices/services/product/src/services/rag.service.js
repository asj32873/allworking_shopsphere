const { postJson, request } = require("../utils/serviceClient");

const RAG_SERVICE = process.env.RAG_SERVICE_URL || "http://localhost:5010";

async function ingestProduct(productId) {
  try {
    const result = await postJson(
      RAG_SERVICE,
      `/internal/products/${productId}/ingest`,
      {},
    );

    if (!result.ok) {
      console.error(
        `RAG ingestion failed for product ${productId}:`,
        result.data?.message || `HTTP ${result.status}`,
      );
    }

    return result;
  } catch (error) {
    console.error(
      `Could not connect to RAG service for product ${productId}:`,
      error.message,
    );

    return null;
  }
}

async function deleteProduct(productId) {
  try {
    const result = await request(
      RAG_SERVICE,
      `/internal/products/${productId}`,
      {
        method: "DELETE",
      },
    );

    if (!result.ok) {
      console.error(
        `RAG delete failed for product ${productId}:`,
        result.data?.message || `HTTP ${result.status}`,
      );
    }

    return result;
  } catch (error) {
    console.error(
      `Could not connect to RAG service for deleting product ${productId}:`,
      error.message,
    );

    return null;
  }
}

module.exports = {
  ingestProduct,
  deleteProduct,
};
