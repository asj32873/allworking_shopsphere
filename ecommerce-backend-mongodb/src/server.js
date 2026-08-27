require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { ingestProducts } = require("./rag/ingest");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initial RAG ingestion
    console.log("Starting product RAG ingestion...");
    await ingestProducts();
    console.log("Product RAG ingestion completed.");

    // 3. Start Express
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ShopSphere API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
})();
