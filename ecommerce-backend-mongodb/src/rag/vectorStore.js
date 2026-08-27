const { Chroma } = require("@langchain/community/vectorstores/chroma");

const embeddings = require("./embeddings");

let vectorStore = null;

async function getVectorStore() {
  if (vectorStore) {
    return vectorStore;
  }

  vectorStore = new Chroma(embeddings, {
    collectionName: "shopsphere-products",

    host: process.env.CHROMA_HOST,
    apiKey: process.env.CHROMA_API_KEY,
    tenant: process.env.CHROMA_TENANT,
    database: process.env.CHROMA_DATABASE,
  });

  return vectorStore;
}

module.exports = {
  getVectorStore,
};