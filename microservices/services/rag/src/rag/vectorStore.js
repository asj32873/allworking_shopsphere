const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { CloudClient } = require("chromadb");
const embeddings = require("./embeddings");

let vectorStore = null;

async function getVectorStore() {
  if (vectorStore) return vectorStore;

  const { CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE } = process.env;

  if (!CHROMA_API_KEY) {
    throw new Error("CHROMA_API_KEY is not configured");
  }

  if (!CHROMA_TENANT) {
    throw new Error("CHROMA_TENANT is not configured");
  }

  if (!CHROMA_DATABASE) {
    throw new Error("CHROMA_DATABASE is not configured");
  }

  console.log("Connecting to Chroma Cloud...");

  const client = new CloudClient({
    apiKey: CHROMA_API_KEY,
    tenant: CHROMA_TENANT,
    database: CHROMA_DATABASE,
  });

  vectorStore = new Chroma(embeddings, {
    collectionName: "shopsphere-products",
    index: client,
  });

  return vectorStore;
}

module.exports = { getVectorStore };
