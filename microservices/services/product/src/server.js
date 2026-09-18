require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env"),
});

const app = require("./app");
const connectDB = require("./config/db");
const { connectRedis, disconnectRedis } = require("./services/redis.service");

const PORT = Number(process.env.PORT || 5003);

(async () => {
  try {
    await connectDB();
    await connectRedis();

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(
        "ShopSphere product service running on http://localhost:" + PORT,
      );
    });

    async function shutdown(signal) {
      console.log(`${signal} received. Shutting down...`);

      server.close(async () => {
        try {
          await disconnectRedis();
          process.exit(0);
        } catch (error) {
          console.error("Shutdown failed:", error);
          process.exit(1);
        }
      });
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (e) {
    console.error("Startup failed:", e);
    process.exit(1);
  }
})();
