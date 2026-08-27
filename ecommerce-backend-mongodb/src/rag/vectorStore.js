const { Chroma } = require("@langchain/community/vectorstores/chroma");

const embeddings = require("./embeddings");

let vectorStore = null;

async function getVectorStore() {
  if (vectorStore) {
    return vectorStore;
  }

  vectorStore = new Chroma(embeddings, {
    collectionName: "shopsphere-products",
    url: process.env.CHROMA_URL || "http://localhost:8000",
  });

  return vectorStore;
}

module.exports = {
  getVectorStore,
};
