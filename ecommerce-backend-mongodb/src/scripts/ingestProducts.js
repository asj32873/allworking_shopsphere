const path = require("path");

const envPath = path.resolve(__dirname, "../../.env");

console.log("Loading .env from:", envPath);

const result = require("dotenv").config({
  path: envPath,
});

console.log("dotenv result:", result);
console.log("MONGODB_URI:", process.env.MONGODB_URI);

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const { ingestProducts } = require("../rag/ingest");

async function run() {
  await connectDB();

  await ingestProducts();

  await mongoose.disconnect();

  console.log("Product RAG ingestion completed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
