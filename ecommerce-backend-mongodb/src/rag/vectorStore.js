const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { CloudClient, ChromaClient } = require("chromadb");

const embeddings = require("./embeddings");

let vectorStore = null;

async function getVectorStore() {
  if (vectorStore) {
    return vectorStore;
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    if (!process.env.CHROMA_API_KEY) {
      throw new Error("CHROMA_API_KEY is required in production");
    }

    if (!process.env.CHROMA_TENANT) {
      throw new Error("CHROMA_TENANT is required in production");
    }

    if (!process.env.CHROMA_DATABASE) {
      throw new Error("CHROMA_DATABASE is required in production");
    }

    const client = new CloudClient({
      apiKey: process.env.CHROMA_API_KEY,
      tenant: process.env.CHROMA_TENANT,
      database: process.env.CHROMA_DATABASE,
    });

    vectorStore = new Chroma(embeddings, {
      collectionName: "shopsphere-products",
      index: client,
    });
  } else {
    const client = new ChromaClient({
      path: process.env.CHROMA_URL || "http://localhost:8000",
    });

    vectorStore = new Chroma(embeddings, {
      collectionName: "shopsphere-products",
      index: client,
    });
  }

  return vectorStore;
}

module.exports = {
  getVectorStore,
};





// const { Chroma } = require("@langchain/community/vectorstores/chroma");

// const embeddings = require("./embeddings");

// let vectorStore = null;

// async function getVectorStore() {
//   if (vectorStore) {
//     return vectorStore;
//   }

//   vectorStore = new Chroma(embeddings, {
//     collectionName: "shopsphere-products",

//     host: process.env.CHROMA_HOST,
//     apiKey: process.env.CHROMA_API_KEY,
//     tenant: process.env.CHROMA_TENANT,
//     database: process.env.CHROMA_DATABASE,
//   });

//   return vectorStore;
// }

// module.exports = {
//   getVectorStore,
// };