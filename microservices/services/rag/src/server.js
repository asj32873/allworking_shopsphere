require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env"),
});

const app = require("./app");
const connectDB = require("./config/db");

const PORT = Number(process.env.PORT || 5010);

(async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ShopSphere RAG service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
})();
