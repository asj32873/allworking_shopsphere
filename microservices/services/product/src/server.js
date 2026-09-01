require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env"),
});
const app = require("./app");
const connectDB = require("./config/db");
const PORT = Number(process.env.PORT || 5003);
(async () => {
  try {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () =>
      console.log(
        "ShopSphere product service running on http://localhost:" + PORT,
      ),
    );
  } catch (e) {
    console.error("Startup failed:", e);
    process.exit(1);
  }
})();
